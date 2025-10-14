package configs

import (
	"os"
	"strconv"
)

// Config holds the application configuration
type Config struct {
	// HTTP
	HTTPPort int

	// CORS
	CORSOrigins string

	// Keycloak / OpenID Connect
	KeycloakBaseURL string
	KeycloakRealm   string

	// Database
	DatabaseURL string
}

// FromEnv charge la configuration depuis les variables d'environnement.
func FromEnv() (Config, error) {
	port := 8082 // default port for organization-service
	if v := os.Getenv("PORT"); v != "" {
		if p, err := strconv.Atoi(v); err == nil {
			port = p
		}
	}

	return Config{
		HTTPPort:        port,
		CORSOrigins:     os.Getenv("CORS_ORIGINS"),
		KeycloakBaseURL: os.Getenv("KEYCLOAK_BASE_URL"),
		KeycloakRealm:   os.Getenv("KEYCLOAK_REALM"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
	}, nil
}
