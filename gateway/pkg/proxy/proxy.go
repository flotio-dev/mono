package proxy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type RequestInfo struct {
	Route   string            `json:"route"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
	Params  string            `json:"params"`
}

type ProxyRequestBody map[string]RequestInfo

func HandleProxy(w http.ResponseWriter, r *http.Request) {
	var requests ProxyRequestBody

	if err := json.NewDecoder(r.Body).Decode(&requests); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	responses := make(map[string]interface{})

	// Récupérer le header Authorization envoyé par le client
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Authorization header missing", http.StatusUnauthorized)
		return
	}

	// Appeler /userinfo pour obtenir les infos de l'utilisateur
	userinfoURL := os.Getenv("KEYCLOAK_BASE_URL") + "/realms/" + os.Getenv("KEYCLOAK_REALM") + "/protocol/openid-connect/userinfo"
	userReq, _ := http.NewRequest("GET", userinfoURL, nil)
	userReq.Header.Set("Authorization", authHeader)

	client := &http.Client{}
	userResp, err := client.Do(userReq)
	fmt.Println(userinfoURL)
	if err != nil || userResp.StatusCode != 200 {
		http.Error(w, "Failed to fetch user info", http.StatusUnauthorized)
		return
	}
	defer userResp.Body.Close()

	var userInfo map[string]interface{}
	bodyBytes, _ := io.ReadAll(userResp.Body)
	json.Unmarshal(bodyBytes, &userInfo)

	// Forward les requêtes en ajoutant les headers et les infos utilisateur
	for id, reqInfo := range requests {
		req, err := http.NewRequest(reqInfo.Method, reqInfo.Route, bytes.NewBufferString(reqInfo.Body))
		if err != nil {
			responses[id] = map[string]interface{}{
				"status":  0,
				"success": false,
				"error":   err.Error(),
			}
			continue
		}

		// Ajouter les headers de la requête et le token
		for k, v := range reqInfo.Headers {
			req.Header.Set(k, v)
		}
		req.Header.Set("Authorization", authHeader)

		// Ajouter les infos utilisateur dans les headers
		for k, v := range userInfo {
			req.Header.Set("X-User-"+k, toString(v))
		}

		if reqInfo.Params != "" {
			req.URL.RawQuery = reqInfo.Params
		}

		resp, err := client.Do(req)
		if err != nil {
			responses[id] = map[string]interface{}{
				"status":  0,
				"success": false,
				"error":   err.Error(),
			}
			continue
		}

		respBody, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var parsed interface{}
		if err := json.Unmarshal(respBody, &parsed); err != nil {
			parsed = string(respBody)
		}

		success := resp.StatusCode >= 200 && resp.StatusCode < 300

		entry := map[string]interface{}{
			"status":  resp.StatusCode,
			"headers": resp.Header,
			"body":    parsed,
			"success": success,
		}

		if success {
			entry["details"] = parsed
		} else {
			entry["error"] = parsed
		}

		responses[id] = entry
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

func toString(v interface{}) string {
	switch val := v.(type) {
	case string:
		return val
	case float64:
		return fmt.Sprintf("%.0f", val)
	case bool:
		return fmt.Sprintf("%t", val)
	default:
		b, _ := json.Marshal(val)
		return string(b)
	}
}
