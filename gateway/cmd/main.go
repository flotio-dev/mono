package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"github.com/MicahParks/keyfunc"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// Middleware pour protéger les routes
func KeycloakAuthMiddleware(jwks *keyfunc.JWKS) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, jwks.Keyfunc)
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Optionnel : tu peux mettre des infos du token dans le contexte
		c.Set("claims", token.Claims)
		c.Next()
	}
}

func main() {
	godotenv.Load()
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("CORS_ORIGINS")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// URL JWKS de ton realm Keycloak
	jwksURL := os.Getenv("KEYCLOAK_BASE_URL") + "/realms/flotio/protocol/openid-connect/certs"

	// Optionally skip authentication for local development by setting SKIP_AUTH=true
	skipAuth := os.Getenv("SKIP_AUTH") == "true"

	var jwks *keyfunc.JWKS
	if skipAuth {
		log.Println("SKIP_AUTH=true -> running without Keycloak authentication (local dev only)")
	} else {
		// Récupère la clé publique automatiquement
		var err error
		jwks, err = keyfunc.Get(jwksURL, keyfunc.Options{})
		if err != nil {
			// Fail fast unless the user explicitly asked to skip auth
			log.Fatalf("Impossible de récupérer JWKS: %v", err)
		}
	}

	// Routes publiques
	router.GET("/public", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Route publique"})
	})

	// Routes protégées avec middleware
	protected := router.Group("/api")
	if !skipAuth && jwks != nil {
		protected.Use(KeycloakAuthMiddleware(jwks))
	} else {
		// In local dev when auth is skipped we still expose the protected routes
		// without the Keycloak middleware so it's easy to test the API.
		log.Println("Protected routes are exposed without Keycloak auth (SKIP_AUTH=true)")
	}
	{
		protected.GET("/hello-world", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Hello World! Token valide ✅"})
		})
	}

	router.Run(os.Getenv("SERVER_URL"))
}
