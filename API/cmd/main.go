package main

import (
	"log"
	"net/http"

	"github.com/flotio-dev/api/pkg/api"
)

func main() {
	log.Println("Starting Flotio API server")
	r := api.Router()
	log.Println("Router configured")

	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	log.Printf("Listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}
