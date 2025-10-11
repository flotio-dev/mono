package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/flotio-dev/organization-service/pkg/httpx"
	"github.com/gorilla/mux"
)

func mountOrganizations(router *mux.Router, keycloakBaseURL, keycloakRealm string) {
	// GET /api/users/me/organizations
	router.HandleFunc("/users/me/organizations", func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header missing", http.StatusUnauthorized)
			return
		}

		userID := r.Header.Get("X-User-Sub")
		if userID == "" {
			http.Error(w, "X-User-Sub header missing", http.StatusUnauthorized)
			return
		}

		// Récupérer les organisations du user
		url := fmt.Sprintf("%s/admin/realms/%s/organizations/members/%s/organizations", keycloakBaseURL, keycloakRealm, userID)
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("Authorization", authHeader)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			bodyBytes, _ := io.ReadAll(resp.Body)
			http.Error(w, fmt.Sprintf("Keycloak returned status %d: %s", resp.StatusCode, string(bodyBytes)), resp.StatusCode)
			return
		}

		var orgs []Organization
		if err := json.NewDecoder(resp.Body).Decode(&orgs); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		httpx.OK(w, orgs)
	}).Methods(http.MethodGet)
}
