package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	router "github.com/flotio-dev/api/pkg/api/v1/router"
	"github.com/flotio-dev/api/pkg/db"
)

func main() {
	godotenv.Load()

	db.InitDB()

	log.Println("Starting Flotio API server")
	r := router.Router()
	log.Println("Router configured")

	port := os.Getenv("API_PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port

	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	log.Printf("Listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}
