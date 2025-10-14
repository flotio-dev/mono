// main.go
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"

	"github.com/flotio-dev/build-service/configs"
	"github.com/flotio-dev/build-service/pkg/api"
	"github.com/flotio-dev/build-service/pkg/auth"
	"github.com/flotio-dev/build-service/pkg/middleware"
)

func main() {
	godotenv.Load()

	cfg, _ := configs.FromEnv()

	// JWKS provider pour Keycloak
	jwksURL := cfg.JWKSURL()
	issuer := cfg.IssuerURL()
	var jwksProv *auth.JWKSProvider
	if jwksURL != "" {
		jwksProv = auth.NewJWKSProvider(jwksURL, issuer)
		log.Printf("JWKS configured: %s", jwksURL)
	} else {
		log.Println("warning: JWKS not configured, authentication disabled")
	}

	// Initialize project service client
	projectServiceURL := cfg.ProjectServiceURL
	if projectServiceURL == "" {
		projectServiceURL = "http://localhost:8081" // default
	}
	api.InitProjectClient(projectServiceURL)

	r := api.Router(jwksProv)

	corsOptions := handlers.CORS(
		handlers.AllowedOrigins([]string{os.Getenv("CORS_ORIGINS")}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Authorization", "Content-Type"}),
		handlers.ExposedHeaders([]string{"Content-Length"}),
		handlers.AllowCredentials(),
	)

	// Middlewares globaux
	r.Use(middleware.LoggingMiddleware)

	log.Printf("Server listening on :%d", cfg.HTTPPort)
	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler:           corsOptions(r),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
	}
	log.Fatal(srv.ListenAndServe())
}
