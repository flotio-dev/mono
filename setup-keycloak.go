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

	// Ensure client roles exist
	err = ensureClientRoles(ctx, client, token.AccessToken, realmName)
	if err != nil {
		fmt.Printf("Failed to ensure client roles: %v\n", err)
		os.Exit(1)
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

		// Assign roles to service account
		err = assignRoles(ctx, client, token.AccessToken, realmName, clientID)
		if err != nil {
			fmt.Printf("Failed to assign roles: %v\n", err)
		}
	} else {
		clientID = *clients[0].ID
		fmt.Println("Client flotio-gateway already exists.")

		// Assign roles if needed
		err = assignRolesIfNeeded(ctx, client, token.AccessToken, realmName, clientID)
		if err != nil {
			fmt.Printf("Failed to assign roles: %v\n", err)
		}
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
	err = writeEnvFile(realmName, *clientDetails.ClientID, *secret.Value, keycloakBaseURL)
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

	// Setup GitHub IDP
	githubClientID := os.Getenv("GITHUB_CLIENT_ID")
	githubClientSecret := os.Getenv("GITHUB_CLIENT_SECRET")
	if githubClientID != "" && githubClientSecret != "" {
		err = setupGitHubIDP(ctx, client, token.AccessToken, realmName)
		if err != nil {
			fmt.Printf("Failed to setup GitHub IDP: %v\n", err)
		}
	} else {
		fmt.Println("GitHub client ID and secret not provided, skipping GitHub setup.")
	}

	fmt.Println("Setup completed successfully!")
}

func ensureClientRoles(ctx context.Context, client *gocloak.GoCloak, token, realmName string) error {
	// Get realm-management client
	clients, err := client.GetClients(ctx, token, realmName, gocloak.GetClientsParams{
		ClientID: &[]string{"realm-management"}[0],
	})
	if err != nil || len(clients) == 0 {
		return fmt.Errorf("failed to find realm-management client")
	}
	realmMgmtClientID := *clients[0].ID

	roles := []string{"read-token", "view-users"}
	for _, roleName := range roles {
		// Check if role exists
		_, err := client.GetClientRole(ctx, token, realmName, realmMgmtClientID, roleName)
		if err != nil {
			// Create role
			role := &gocloak.Role{
				Name:        &roleName,
				Description: &[]string{roleName + " role"}[0],
			}
			_, err = client.CreateClientRole(ctx, token, realmName, realmMgmtClientID, *role)
			if err != nil {
				return fmt.Errorf("failed to create client role %s: %v", roleName, err)
			}
			fmt.Printf("Client role %s created.\n", roleName)
		}
	}
	return nil
}

func assignRoles(ctx context.Context, client *gocloak.GoCloak, token, realmName, clientID string) error {
	// Get service account user
	users, err := client.GetUsers(ctx, token, realmName, gocloak.GetUsersParams{
		Username: &[]string{"service-account-flotio-gateway"}[0],
	})
	if err != nil || len(users) == 0 {
		return fmt.Errorf("failed to find service account user")
	}
	serviceAccountID := *users[0].ID
	fmt.Printf("SERVICE_ACCOUNT_ID: %s\n", serviceAccountID)

	// Get realm-management client
	clients, err := client.GetClients(ctx, token, realmName, gocloak.GetClientsParams{
		ClientID: &[]string{"realm-management"}[0],
	})
	if err != nil || len(clients) == 0 {
		return fmt.Errorf("failed to find realm-management client")
	}
	realmMgmtClientID := *clients[0].ID

	// Get roles
	readTokenRole, err := client.GetClientRole(ctx, token, realmName, realmMgmtClientID, "read-token")
	if err != nil {
		return err
	}
	viewUsersRole, err := client.GetClientRole(ctx, token, realmName, realmMgmtClientID, "view-users")
	if err != nil {
		return err
	}

	roles := []gocloak.Role{*readTokenRole, *viewUsersRole}
	err = client.AddClientRolesToUser(ctx, token, realmName, realmMgmtClientID, serviceAccountID, roles)
	if err != nil {
		return fmt.Errorf("failed to assign roles: %v", err)
	}
	fmt.Println("Client roles assigned to service account.")
	return nil
}

func assignRolesIfNeeded(ctx context.Context, client *gocloak.GoCloak, token, realmName, clientID string) error {
	// Get service account user
	users, err := client.GetUsers(ctx, token, realmName, gocloak.GetUsersParams{
		Username: &[]string{"service-account-flotio-gateway"}[0],
	})
	if err != nil || len(users) == 0 {
		return fmt.Errorf("failed to find service account user")
	}
	serviceAccountID := *users[0].ID
	fmt.Printf("SERVICE_ACCOUNT_ID: %s\n", serviceAccountID)

	// Get realm-management client
	clients, err := client.GetClients(ctx, token, realmName, gocloak.GetClientsParams{
		ClientID: &[]string{"realm-management"}[0],
	})
	if err != nil || len(clients) == 0 {
		return fmt.Errorf("failed to find realm-management client")
	}
	realmMgmtClientID := *clients[0].ID

	// Get roles
	readTokenRole, err := client.GetClientRole(ctx, token, realmName, realmMgmtClientID, "read-token")
	if err != nil {
		return err
	}
	viewUsersRole, err := client.GetClientRole(ctx, token, realmName, realmMgmtClientID, "view-users")
	if err != nil {
		return err
	}

	roles := []gocloak.Role{*readTokenRole, *viewUsersRole}
	err = client.AddClientRolesToUser(ctx, token, realmName, realmMgmtClientID, serviceAccountID, roles)
	if err != nil {
		return fmt.Errorf("failed to assign roles: %v", err)
	}
	fmt.Println("Roles assigned to service account.")
	return nil
}

func writeEnvFile(realmName, clientID, clientSecret, baseURL string) error {
	envContent := fmt.Sprintf(`KEYCLOAK_REALM=%s
KEYCLOAK_CLIENT_ID=%s
KEYCLOAK_CLIENT_SECRET=%s
KEYCLOAK_ID=%s
KEYCLOAK_SECRET=%s
KEYCLOAK_BASE_URL=%s
KEYCLOAK_ISSUER=%s/realms/%s
`, realmName, clientID, clientSecret, clientID, clientSecret, baseURL, baseURL, realmName)

	err := os.WriteFile("front/.env", []byte(envContent), 0644)
	if err != nil {
		return fmt.Errorf("failed to write front/.env file: %v", err)
	}
	fmt.Println("front/.env file written.")
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

func setupGitHubIDP(ctx context.Context, client *gocloak.GoCloak, token, realmName string) error {
	// Check if GitHub IDP exists
	idps, err := client.GetIdentityProviders(ctx, token, realmName)
	if err != nil {
		return err
	}
	for _, idp := range idps {
		if *idp.Alias == "github" {
			fmt.Println("GitHub identity provider already exists.")
			return nil
		}
	}

	// Create GitHub IDP
	idp := &gocloak.IdentityProviderRepresentation{
		Alias:                    &[]string{"github"}[0],
		DisplayName:              &[]string{"GitHub"}[0],
		ProviderID:               &[]string{"github"}[0],
		Enabled:                  &[]bool{true}[0],
		TrustEmail:               &[]bool{true}[0],
		StoreToken:               &[]bool{true}[0],
		AddReadTokenRoleOnCreate: &[]bool{true}[0],
		Config: &map[string]string{
			"clientId":     os.Getenv("GITHUB_CLIENT_ID"),
			"clientSecret": os.Getenv("GITHUB_CLIENT_SECRET"),
			"useJwksUrl":   "true",
			"storeToken":   "true",
		},
	}

	_, err = client.CreateIdentityProvider(ctx, token, realmName, *idp)
	if err != nil {
		return fmt.Errorf("failed to create GitHub IDP: %v", err)
	}
	fmt.Println("GitHub identity provider created.")
	return nil
}
