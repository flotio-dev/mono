package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/Nerzal/gocloak/v13"
	"github.com/flotio-dev/api/pkg/db"
)

func getKeycloakClient() *gocloak.GoCloak {
	return gocloak.NewClient(os.Getenv("KEYCLOAK_BASE_URL"))
}

func getAdminToken(ctx context.Context, client *gocloak.GoCloak) (*gocloak.JWT, error) {
	return client.LoginAdmin(ctx, "admin", "admin", "master")
}

// Auth handlers
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var userData struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	client := getKeycloakClient()
	ctx := context.Background()
	token, err := getAdminToken(ctx, client)
	if err != nil {
		http.Error(w, "Failed to authenticate with Keycloak", http.StatusInternalServerError)
		return
	}

	realm := os.Getenv("KEYCLOAK_REALM")

	// Create user
	user := &gocloak.User{
		Username: &userData.Username,
		Email:    &userData.Email,
		Enabled:  gocloak.BoolP(true),
	}
	userID, err := client.CreateUser(ctx, token.AccessToken, realm, *user)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Set password
	err = client.SetPassword(ctx, token.AccessToken, userID, realm, userData.Password, false)
	if err != nil {
		http.Error(w, "Failed to set password", http.StatusInternalServerError)
		return
	}

	// Create user in DB
	dbUser := db.User{
		KeycloakID: userID,
		Email:      userData.Email,
		Username:   userData.Username,
	}
	if err := db.DB.Create(&dbUser).Error; err != nil {
		http.Error(w, "Failed to create user in database", http.StatusInternalServerError)
		return
	}

	// Login to get token
	clientID := os.Getenv("KEYCLOAK_CLIENT_ID")
	loginToken, err := client.Login(ctx, clientID, "", realm, userData.Username, userData.Password)
	if err != nil {
		http.Error(w, "Failed to login after registration", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"token": loginToken.AccessToken})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	client := getKeycloakClient()
	ctx := context.Background()
	realm := os.Getenv("KEYCLOAK_REALM")
	clientID := os.Getenv("KEYCLOAK_CLIENT_ID")

	token, err := client.Login(ctx, clientID, "", realm, creds.Username, creds.Password)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	writeJSON(w, map[string]string{"token": token.AccessToken})
}

func MeGetHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	writeJSON(w, userInfo)
}

func MePutHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var updateData struct {
		Email     *string `json:"email,omitempty"`
		FirstName *string `json:"firstName,omitempty"`
		LastName  *string `json:"lastName,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	client := getKeycloakClient()
	ctx := context.Background()
	realm := os.Getenv("KEYCLOAK_REALM")

	adminToken, err := getAdminToken(ctx, client)
	if err != nil {
		http.Error(w, "Failed to authenticate with Keycloak", http.StatusInternalServerError)
		return
	}

	// Update user
	userUpdate := &gocloak.User{
		ID:        userInfo.Sub,
		Email:     updateData.Email,
		FirstName: updateData.FirstName,
		LastName:  updateData.LastName,
	}
	err = client.UpdateUser(ctx, adminToken.AccessToken, realm, *userUpdate)
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"status": "updated"})
}

func GithubHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	action := r.URL.Query().Get("action")
	switch action {
	case "login":
		// Generate GitHub OAuth URL
		clientID := os.Getenv("GITHUB_CLIENT_ID")
		if clientID == "" {
			clientID = "mock_client_id"
		}
		redirectURI := "http://localhost:3000/api/auth/github/callback" // Example
		scope := "repo,user"
		url := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=%s", clientID, url.QueryEscape(redirectURI), scope)
		writeJSON(w, map[string]string{"login_url": url})

	case "list-repo":
		// Mock list of repos
		repos := []map[string]string{
			{"id": "1", "name": "repo1", "full_name": "user/repo1"},
			{"id": "2", "name": "repo2", "full_name": "user/repo2"},
		}
		writeJSON(w, map[string]interface{}{"repos": repos})

	case "detail-repo":
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}
		// Mock repo details (folders)
		folders := []string{"src", "docs", "tests"}
		writeJSON(w, map[string]interface{}{"repo_id": id, "folders": folders})

	default:
		http.Error(w, "Invalid action", http.StatusBadRequest)
	}
}
