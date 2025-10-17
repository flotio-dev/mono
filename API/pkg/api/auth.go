package api

import (
	"net/http"
)

// Auth handlers
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "registered"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "logged_in"})
}

func MeGetHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"user": "me"})
}

func MePutHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "updated"})
}

func GithubHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("action")
	writeJSON(w, map[string]string{"action": q})
}
