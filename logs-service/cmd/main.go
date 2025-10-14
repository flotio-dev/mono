// main.go
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"

	"github.com/flotio-dev/logs-service/pkg/api"
	"github.com/flotio-dev/logs-service/pkg/httpx"
	"github.com/flotio-dev/logs-service/pkg/middleware"
)

func main() {
	godotenv.Load()

	r := api.Router()

	corsOptions := handlers.CORS(
		handlers.AllowedOrigins([]string{os.Getenv("CORS_ORIGINS")}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Authorization", "Content-Type"}),
		handlers.ExposedHeaders([]string{"Content-Length"}),
		handlers.AllowCredentials(),
	)

	// Middlewares globaux
	r.Use(middleware.LoggingMiddleware)

	// Routes publiques
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpx.OK(w, map[string]any{"status": "ok"})
	}).Methods("GET")

	r.HandleFunc("/world", func(w http.ResponseWriter, r *http.Request) {
		httpx.OK(w, map[string]any{"message": "World!"})
	}).Methods("GET")

	log.Println("Server listening on " + os.Getenv("SERVER_URL"))
	log.Fatal(http.ListenAndServe(os.Getenv("SERVER_URL"), corsOptions(r)))
}
