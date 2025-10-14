package api

import (
	"net/http"
	"time"

	"github.com/flotio-dev/build-service/pkg/auth"
	"github.com/flotio-dev/build-service/pkg/httpx"
	"github.com/flotio-dev/build-service/pkg/middleware"
	"github.com/gorilla/mux"
)

func Router(jwksProv *auth.JWKSProvider) *mux.Router {
	r := mux.NewRouter()

	// Public routes
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpx.OK(w, map[string]any{"status": "ok", "time": time.Now()})
	}).Methods(http.MethodGet)

	r.HandleFunc("/world", func(w http.ResponseWriter, r *http.Request) {
		httpx.OK(w, map[string]any{"message": "World!"})
	}).Methods(http.MethodGet)

	// Protected API
	api := r.PathPrefix("/").Subrouter()
	if jwksProv != nil {
		api.Use(middleware.RequireAuth(jwksProv, ""))
	}

	mountBuilds(api)

	return r
}
