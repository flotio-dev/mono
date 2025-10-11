package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/MicahParks/keyfunc"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"github.com/flotio-dev/gateway/pkg/middleware"
	"github.com/flotio-dev/gateway/pkg/proxy"
)

func main() {
	godotenv.Load()
	skipAuth := os.Getenv("SKIP_AUTH") == "true"

	r := mux.NewRouter()

	// middlewares
	r.Use(middleware.LoggingMiddleware)

	jwksURL := os.Getenv("KEYCLOAK_BASE_URL") + "/realms/flotio/protocol/openid-connect/certs"
	// Optionally skip authentication for local development by setting SKIP_AUTH=true
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

	// Routes protégées avec middleware
	// protected := r.PathPrefix("/api").Subrouter()
	protected := r.PathPrefix("").Subrouter()
	if !skipAuth && jwks != nil {
		protected.Use(middleware.KeycloakAuthMiddleware(jwks))
	} else {
		// In local dev when auth is skipped we still expose the protected routes
		// without the Keycloak middleware so it's easy to test the API.
		log.Println("Protected routes are exposed without Keycloak auth (SKIP_AUTH=true)")
	}

	protected.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Hello!"})
	}).Methods("GET")

	r.HandleFunc("/world", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "World!"})
	}).Methods("GET")

	r.HandleFunc("/api/gateway/proxy", proxy.HandleProxy).Methods("POST")

	corsOptions := handlers.CORS(
		handlers.AllowedOrigins([]string{os.Getenv("CORS_ORIGINS")}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Authorization", "Content-Type"}),
		handlers.ExposedHeaders([]string{"Content-Length"}),
		handlers.AllowCredentials(),
	)

	log.Println("Server listening on " + os.Getenv("SERVER_URL"))
	if err := http.ListenAndServe(os.Getenv("SERVER_URL"), corsOptions(r)); err != nil {
		log.Fatal(err)
	}
}
