package api

import (
	"net/http"

	"github.com/gorilla/mux"
)

func Router() http.Handler {
	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/auth/register", RegisterHandler).Methods("POST")
	r.HandleFunc("/auth/login", LoginHandler).Methods("POST")
	r.HandleFunc("/auth/@me", MeGetHandler).Methods("GET")
	r.HandleFunc("/auth/@me", MePutHandler).Methods("PUT")

	// Github route
	r.HandleFunc("/github", GithubHandler).Methods("GET")

	// Env routes (root /)
	r.HandleFunc("/", EnvGetHandler).Methods("GET")
	r.HandleFunc("/", EnvPostHandler).Methods("POST")
	r.HandleFunc("/", EnvDeleteHandler).Methods("DELETE")
	r.HandleFunc("/", EnvPutHandler).Methods("PUT")

	// Project routes
	r.HandleFunc("/project", ProjectsGetHandler).Methods("GET")
	r.HandleFunc("/project", ProjectCreateHandler).Methods("POST")
	r.HandleFunc("/project/{id}", ProjectGetHandler).Methods("GET")
	r.HandleFunc("/project/{id}", ProjectPutHandler).Methods("PUT")
	r.HandleFunc("/project/{id}", ProjectDeleteHandler).Methods("DELETE")
	r.HandleFunc("/project/{id}/build", ProjectBuildHandler).Methods("POST")

	// Health check
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("ok"))
	}).Methods("GET")

	return r
}
