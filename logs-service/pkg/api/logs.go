package api

import (
	"net/http"

	"github.com/flotio-dev/logs-service/pkg/httpx"
	"github.com/gorilla/mux"
)

func mountLogs(router *mux.Router) {
	// GET /api/logs
	router.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		// Logic to get logs
		httpx.OK(w, map[string]any{"logs": []string{"log1", "log2"}})
	}).Methods(http.MethodGet)

	// POST /api/logs
	router.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		// Logic to create log
		httpx.Created(w, map[string]any{"message": "Log created"})
	}).Methods(http.MethodPost)
}
