package api

import (
	"net/http"

	"github.com/gorilla/mux"
)

// Projects
func ProjectsGetHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"projects": "list"})
}
func ProjectCreateHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"project": "created"})
}
func ProjectGetHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"]})
}
func ProjectPutHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "status": "updated"})
}
func ProjectDeleteHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "status": "deleted"})
}
func ProjectBuildHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "build": "started"})
}
