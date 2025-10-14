package configs

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds the application configuration
type Config struct {
	// HTTP
	HTTPPort int

	// Keycloak / OpenID Connect
	KeycloakBaseURL string // ex: https://auth.example.com
	KeycloakRealm   string // ex: my-realm

	// Services
	ProjectServiceURL string
}

// JWKSURL retourne l'URL JWKS de Keycloak.
func (c Config) JWKSURL() string {
	if c.KeycloakBaseURL == "" || c.KeycloakRealm == "" {
		return ""
	}
	return fmt.Sprintf("%s/realms/%s/protocol/openid-connect/certs", c.KeycloakBaseURL, c.KeycloakRealm)
}

// IssuerURL retourne l'issuer attendu pour la validation des tokens.
func (c Config) IssuerURL() string {
	if c.KeycloakBaseURL == "" || c.KeycloakRealm == "" {
		return ""
	}
	return fmt.Sprintf("%s/realms/%s", c.KeycloakBaseURL, c.KeycloakRealm)
}

// FromEnv charge la configuration depuis les variables d'environnement.
func FromEnv() (Config, error) {
	port := 8082 // default port for build-service
	if v := os.Getenv("PORT"); v != "" {
		if p, err := strconv.Atoi(v); err == nil {
			port = p
		}
	}

	return Config{
		HTTPPort:          port,
		KeycloakBaseURL:   os.Getenv("KEYCLOAK_BASE_URL"),
		KeycloakRealm:     os.Getenv("KEYCLOAK_REALM"),
		ProjectServiceURL: os.Getenv("PROJECT_SERVICE_URL"),
	}, nil
}
