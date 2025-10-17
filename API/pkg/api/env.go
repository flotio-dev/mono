package api

import (
	"net/http"

	"github.com/gorilla/mux"
)

// Env handlers
func EnvGetHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	projectID := vars["id"]
	writeJSON(w, map[string]string{"project": projectID, "envs": "list"})
}
func EnvPostHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	projectID := vars["id"]
	writeJSON(w, map[string]string{"project": projectID, "envs": "set"})
}
func EnvDeleteHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	projectID := vars["id"]
	writeJSON(w, map[string]string{"project": projectID, "envs": "deleted"})
}
func EnvPutHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	projectID := vars["id"]
	writeJSON(w, map[string]string{"project": projectID, "envs": "updated"})
}
