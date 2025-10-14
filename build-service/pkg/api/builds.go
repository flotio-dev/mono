package api

import (
	"net/http"

	"github.com/flotio-dev/build-service/pkg/httpx"
	"github.com/gorilla/mux"
)

func mountBuilds(router *mux.Router) {
	// GET /api/builds
	router.HandleFunc("/builds", func(w http.ResponseWriter, r *http.Request) {
		// Logic to get builds
		httpx.OK(w, map[string]any{"builds": []string{"build1", "build2"}})
	}).Methods(http.MethodGet)

	// POST /api/builds
	router.HandleFunc("/builds", func(w http.ResponseWriter, r *http.Request) {
		// Logic to create build
		httpx.Created(w, map[string]any{"message": "Build created"})
	}).Methods(http.MethodPost)
}
