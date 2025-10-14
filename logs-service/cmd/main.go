// main.go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"

	"github.com/flotio-dev/logs-service/configs"
	"github.com/flotio-dev/logs-service/pkg/api"
	"github.com/flotio-dev/logs-service/pkg/httpx"
	"github.com/flotio-dev/logs-service/pkg/middleware"
)

func main() {
	godotenv.Load()

	cfg, _ := configs.FromEnv()

	r := api.Router()

	corsOptions := handlers.CORS(
		handlers.AllowedOrigins([]string{cfg.CORSOrigins}),
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
