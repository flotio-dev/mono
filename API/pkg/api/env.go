package api

import (
	"net/http"
)

// Env handlers
func EnvGetHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"envs": "list"})
}
func EnvPostHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"envs": "set"})
}
func EnvDeleteHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"envs": "deleted"})
}
func EnvPutHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"envs": "updated"})
}
