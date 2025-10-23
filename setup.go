package main

import (
	"context"
	"fmt"
	"os"

	"github.com/Nerzal/gocloak/v13"
	"github.com/joho/godotenv"
)

func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	godotenv.Load()

	fmt.Println("Env GITHUB_WEBHOOK_SECRET =", os.Getenv("GITHUB_WEBHOOK_SECRET"))
	fmt.Println("Env NEXT_PUBLIC_GITHUB_APP =", os.Getenv("NEXT_PUBLIC_GITHUB_APP"))

	// Configuration
	keycloakBaseURL := getEnvWithDefault("KEYCLOAK_BASE_URL", "http://localhost:8081")
	realmName := getEnvWithDefault("KEYCLOAK_REALM", "flotio")

	client := gocloak.NewClient(keycloakBaseURL)
	ctx := context.Background()

	// Login as admin
	token, err := client.LoginAdmin(ctx, "admin", "admin", "master")
	if err != nil {
		fmt.Printf("Failed to login as admin: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Logged in to Keycloak at %s. Setting up realm '%s'...\n", keycloakBaseURL, realmName)

	// Check if realm exists
	_, err = client.GetRealm(ctx, token.AccessToken, realmName)
	realmExists := err == nil

	if !realmExists {
		// Create realm
		realm := &gocloak.RealmRepresentation{
			Realm:       &realmName,
			Enabled:     gocloak.BoolP(true),
			DisplayName: gocloak.StringP("Flotio"),
			SslRequired: gocloak.StringP("external"),
		}
		_, err = client.CreateRealm(ctx, token.AccessToken, *realm)
		if err != nil {
			fmt.Printf("Failed to create realm: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Realm '%s' created.\n", realmName)
	}

	// Check if client exists
	clients, err := client.GetClients(ctx, token.AccessToken, realmName, gocloak.GetClientsParams{
		ClientID: &[]string{"flotio-gateway"}[0],
	})
	if err != nil {
		fmt.Printf("Failed to check client: %v\n", err)
		os.Exit(1)
	}

	var clientID string
	if len(clients) == 0 {
		// Create client
		newClient := &gocloak.Client{
			ClientID:                  &[]string{"flotio-gateway"}[0],
			Enabled:                   gocloak.BoolP(true),
			Protocol:                  gocloak.StringP("openid-connect"),
			PublicClient:              gocloak.BoolP(false),
			DirectAccessGrantsEnabled: gocloak.BoolP(true),
			ServiceAccountsEnabled:    gocloak.BoolP(true),
			ImplicitFlowEnabled:       gocloak.BoolP(false),
			StandardFlowEnabled:       gocloak.BoolP(true),
			RedirectURIs:              &[]string{keycloakBaseURL + "/realms/" + realmName + "/account/*"},
			WebOrigins:                &[]string{keycloakBaseURL},
		}
		clientID, err = client.CreateClient(ctx, token.AccessToken, realmName, *newClient)
		if err != nil {
			fmt.Printf("Failed to create client: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Client flotio-gateway created.")
	} else {
		clientID = *clients[0].ID
		fmt.Println("Client flotio-gateway already exists.")
	}

	// Get client secret
	secret, err := client.GetClientSecret(ctx, token.AccessToken, realmName, clientID)
	if err != nil {
		fmt.Printf("Failed to get client secret: %v\n", err)
		os.Exit(1)
	}

	// Get client details for client ID string
	clientDetails, err := client.GetClient(ctx, token.AccessToken, realmName, clientID)
	if err != nil {
		fmt.Printf("Failed to get client details: %v\n", err)
		os.Exit(1)
	}

	// Write env file
	// Collect additional env values with sensible defaults
	databaseURL := getEnvWithDefault("DATABASE_URL", "postgres://flotio:flotio@localhost:5432/flotio?sslmode=disable")
	apiPort := getEnvWithDefault("API_PORT", "8080")
	githubClientID := getEnvWithDefault("GITHUB_CLIENT_ID", "xxx")
	githubClientSecret := getEnvWithDefault("GITHUB_CLIENT_SECRET", "xxxx")
	nextPublicAPI := getEnvWithDefault("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080")
	nextPublicOrg := getEnvWithDefault("NEXT_PUBLIC_ORGANIZATION_SERVICE_BASE_URL", "http://localhost:8082")
	nextPublicProject := getEnvWithDefault("NEXT_PUBLIC_PROJECT_SERVICE_BASE_URL", "http://localhost:8083")
	githubWebhookSecret := getEnvWithDefault("GITHUB_WEBHOOK_SECRET", "secret")
	nextPublicGithubApp := getEnvWithDefault("NEXT_PUBLIC_GITHUB_APP", "app")

	kubeAPIURL := getEnvWithDefault("KUBE_API_URL", "https://127.0.0.1:6443")
	kubeToken := getEnvWithDefault("KUBE_TOKEN", "")

	err = writeEnvFile(realmName, *clientDetails.ClientID, *secret.Value, keycloakBaseURL, databaseURL, apiPort, githubClientID, githubClientSecret, nextPublicAPI, nextPublicOrg, nextPublicProject, githubWebhookSecret, nextPublicGithubApp, kubeAPIURL, kubeToken)
	if err != nil {
		fmt.Printf("Failed to write env file: %v\n", err)
	} else {
		fmt.Println("Keycloak configuration saved to front/.env")
	}

	// Create default user
	err = createDefaultUser(ctx, client, token.AccessToken, realmName)
	if err != nil {
		fmt.Printf("Failed to create default user: %v\n", err)
	}

	fmt.Println("Setup completed successfully!")
}

func writeEnvFile(realmName, clientID, clientSecret, baseURL, databaseURL, apiPort, githubClientID, githubClientSecret, nextPublicGateway, nextPublicOrg, nextPublicProject, githubWebhookSecret, nextPublicGithubApp, kubeAPIURL, kubeToken string) error {
	// Create API env content
	apiEnv := fmt.Sprintf(`KEYCLOAK_REALM=%s
KEYCLOAK_CLIENT_ID=%s
KEYCLOAK_CLIENT_SECRET=%s
KEYCLOAK_ID=%s
KEYCLOAK_SECRET=%s
KEYCLOAK_BASE_URL=%s
KEYCLOAK_ISSUER=%s/realms/%s

# API Configuration
API_PORT=%s
GITHUB_CLIENT_ID=%s
GITHUB_CLIENT_SECRET=%s

# Database Configuration
DATABASE_URL=%s

# Kubernetes Configuration
KUBE_API_URL=%s
KUBE_TOKEN=%s

# Github Configuration
GITHUB_WEBHOOK_SECRET=%s
`, realmName, clientID, clientSecret, clientID, clientSecret, baseURL, baseURL, realmName, apiPort, githubClientID, githubClientSecret, databaseURL, kubeAPIURL, kubeToken, githubWebhookSecret)

	// Create front env content
	frontEnv := fmt.Sprintf(`KEYCLOAK_REALM=%s
KEYCLOAK_CLIENT_ID=%s
KEYCLOAK_CLIENT_SECRET=%s
KEYCLOAK_ID=%s
KEYCLOAK_SECRET=%s
KEYCLOAK_BASE_URL=%s
KEYCLOAK_ISSUER=%s/realms/%s

# Gateway Configuration
NEXT_PUBLIC_API_BASE_URL=%s
NEXT_PUBLIC_ORGANIZATION_SERVICE_BASE_URL=%s
NEXT_PUBLIC_PROJECT_SERVICE_BASE_URL=%s

# Github Configuration
NEXT_PUBLIC_GITHUB_APP=%s
`, realmName, clientID, clientSecret, clientID, clientSecret, baseURL, baseURL, realmName, nextPublicGateway, nextPublicOrg, nextPublicProject, nextPublicGithubApp)

	// Write front/.env
	if err := os.WriteFile("front/.env", []byte(frontEnv), 0644); err != nil {
		return fmt.Errorf("failed to write front/.env file: %v", err)
	}

	// Write API/.env
	if err := os.WriteFile("API/.env", []byte(apiEnv), 0644); err != nil {
		return fmt.Errorf("failed to write API/.env file: %v", err)
	}

	fmt.Println("front/.env file written.")
	fmt.Println("API/.env file written.")
	return nil
}

func createDefaultUser(ctx context.Context, client *gocloak.GoCloak, token, realmName string) error {
	// Check if user exists
	users, err := client.GetUsers(ctx, token, realmName, gocloak.GetUsersParams{
		Username: &[]string{"flotio"}[0],
	})
	if err != nil {
		return err
	}
	if len(users) > 0 {
		fmt.Println("Default user already exists.")
		return nil
	}

	// Create user
	user := &gocloak.User{
		Username:  &[]string{"flotio"}[0],
		Email:     &[]string{"flotio@example.com"}[0],
		FirstName: &[]string{"Flotio"}[0],
		LastName:  &[]string{"User"}[0],
		Enabled:   &[]bool{true}[0],
	}

	userID, err := client.CreateUser(ctx, token, realmName, *user)
	if err != nil {
		return fmt.Errorf("failed to create user: %v", err)
	}
	fmt.Printf("User created with ID: %s\n", userID)

	// Set password
	err = client.SetPassword(ctx, token, userID, realmName, "flotio", false)
	if err != nil {
		return fmt.Errorf("failed to set password: %v", err)
	}
	fmt.Println("Password set for default user.")
	return nil
}
