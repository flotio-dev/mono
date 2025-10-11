package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"

	"github.com/MicahParks/keyfunc"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// Config holds all configuration for the application
type Config struct {
	CORSOrigins     []string
	KeycloakBaseURL string
	SkipAuth        bool
	ServerURL       string
}

// loadConfig loads and validates configuration from environment variables
func loadConfig() (*Config, error) {
	godotenv.Load()

	config := &Config{
		CORSOrigins:     strings.Split(os.Getenv("CORS_ORIGINS"), ","),
		KeycloakBaseURL: os.Getenv("KEYCLOAK_BASE_URL"),
		SkipAuth:        os.Getenv("SKIP_AUTH") == "true",
		ServerURL:       os.Getenv("SERVER_URL"),
	}

	// Basic validation
	if config.ServerURL == "" {
		config.ServerURL = ":8080" // default
	}
	if config.KeycloakBaseURL == "" && !config.SkipAuth {
		return nil, fmt.Errorf("KEYCLOAK_BASE_URL is required when SKIP_AUTH is not true")
	}

	return config, nil
}

// Middleware pour protéger les routes
func KeycloakAuthMiddleware(jwks *keyfunc.JWKS) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			logrus.Warn("Missing or invalid Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, jwks.Keyfunc)
		if err != nil || !token.Valid {
			logrus.WithError(err).Warn("Invalid token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Validate claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logrus.Warn("Invalid token claims")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Check issuer
		if iss, ok := claims["iss"].(string); !ok || iss != os.Getenv("KEYCLOAK_BASE_URL")+"/realms/flotio" {
			logrus.WithField("iss", iss).Warn("Invalid issuer")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid issuer"})
			c.Abort()
			return
		}

		// Check audience (optional, adjust as needed)
		if aud, ok := claims["aud"].([]interface{}); ok {
			validAud := false
			for _, a := range aud {
				if aStr, ok := a.(string); ok && aStr == "flotio" {
					validAud = true
					break
				}
			}
			if !validAud {
				logrus.WithField("aud", aud).Warn("Invalid audience")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid audience"})
				c.Abort()
				return
			}
		}

		// Optionnel : tu peux mettre des infos du token dans le contexte
		c.Set("claims", claims)
		c.Next()
	}
}

func main() {
	config, err := loadConfig()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load config")
	}

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     config.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// URL JWKS de ton realm Keycloak
	jwksURL := config.KeycloakBaseURL + "/realms/flotio/protocol/openid-connect/certs"

	var jwks *keyfunc.JWKS
	if config.SkipAuth {
		logrus.Info("SKIP_AUTH=true -> running without Keycloak authentication (local dev only)")
	} else {
		// Récupère la clé publique automatiquement
		jwks, err = keyfunc.Get(jwksURL, keyfunc.Options{})
		if err != nil {
			// Fail fast unless the user explicitly asked to skip auth
			logrus.WithError(err).Fatal("Impossible de récupérer JWKS")
		}
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Routes publiques
	router.GET("/public", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Route publique"})
	})

	// Routes protégées avec middleware
	protected := router.Group("/api")
	if !config.SkipAuth && jwks != nil {
		protected.Use(KeycloakAuthMiddleware(jwks))
	} else {
		// In local dev when auth is skipped we still expose the protected routes
		// without the Keycloak middleware so it's easy to test the API.
		logrus.Info("Protected routes are exposed without Keycloak auth (SKIP_AUTH=true)")
	}
	{
		protected.GET("/hello-world", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Hello World! Token valide ✅"})
		})
	}

	logrus.WithField("server_url", config.ServerURL).Info("Starting server")
	router.Run(config.ServerURL)
}
