package api

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Projects
func ProjectsGetHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	writeJSON(w, map[string]string{"projects": "list"})
}
func ProjectCreateHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	writeJSON(w, map[string]string{"project": "created"})
}
func ProjectGetHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"]})
}
func ProjectPutHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "status": "updated"})
}
func ProjectDeleteHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "status": "deleted"})
}
func ProjectBuildHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "build": "started"})
}

func BuildCancelHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]string{"project": vars["id"], "build": vars["buildId"], "status": "cancelled"})
}

func BuildsListHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]interface{}{"project": vars["id"], "builds": []string{"build1", "build2"}})
}

func BuildLogsHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	writeJSON(w, map[string]interface{}{"project": vars["id"], "build": vars["buildId"], "logs": "build logs here"})
}

func BuildLogsWSHandler(w http.ResponseWriter, r *http.Request) {
	// Auth via query param
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	// Validate token (simplified, in real app use proper validation)
	client := getKeycloakClient()
	ctx := context.Background()
	realm := os.Getenv("KEYCLOAK_REALM")
	_, err := client.GetUserInfo(ctx, token, realm)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for demo
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// Simulate sending logs
	logs := []string{"Starting build...", "Compiling...", "Build successful!"}
	for _, log := range logs {
		err := conn.WriteMessage(websocket.TextMessage, []byte(log))
		if err != nil {
			break
		}
		time.Sleep(1 * time.Second)
	}
}

func BuildDownloadHandler(w http.ResponseWriter, r *http.Request) {
	if getUserFromContext(r.Context()) == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	// Simulate file download
	filename := "app-" + vars["buildId"] + ".apk"
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	w.Write([]byte("fake apk content"))
}
