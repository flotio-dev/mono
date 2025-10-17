package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/flotio-dev/api/pkg/db"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

// Projects
func ProjectsGetHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user db.User
	if err := db.DB.Where("keycloak_id = ?", *userInfo.Sub).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch user", http.StatusInternalServerError)
		return
	}

	var projects []db.Project
	if err := db.DB.Where("user_id = ?", user.ID).Find(&projects).Error; err != nil {
		http.Error(w, "Failed to fetch projects", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"projects": projects})
}
func ProjectCreateHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user db.User
	if err := db.DB.Where("keycloak_id = ?", *userInfo.Sub).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch user", http.StatusInternalServerError)
		return
	}

	var req struct {
		Name           string `json:"name"`
		GitRepo        string `json:"git_repo"`
		BuildFolder    string `json:"build_folder,omitempty"`
		FlutterVersion string `json:"flutter_version,omitempty"`
	}
	if err := readJSON(r, &req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	project := db.Project{
		Name:           req.Name,
		GitRepo:        req.GitRepo,
		BuildFolder:    req.BuildFolder,
		FlutterVersion: req.FlutterVersion,
		UserID:         user.ID,
	}

	if err := db.DB.Create(&project).Error; err != nil {
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"project": project})
}
func ProjectGetHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var project db.Project
	if err := db.DB.Preload("Builds").Preload("Envs").Where("id = ? AND user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).First(&project).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch project", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"project": project})
}
func ProjectPutHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Name           string `json:"name,omitempty"`
		GitRepo        string `json:"git_repo,omitempty"`
		BuildFolder    string `json:"build_folder,omitempty"`
		FlutterVersion string `json:"flutter_version,omitempty"`
	}
	if err := readJSON(r, &req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var project db.Project
	if err := db.DB.Where("id = ? AND user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).First(&project).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch project", http.StatusInternalServerError)
		return
	}

	if req.Name != "" {
		project.Name = req.Name
	}
	if req.GitRepo != "" {
		project.GitRepo = req.GitRepo
	}
	if req.BuildFolder != "" {
		project.BuildFolder = req.BuildFolder
	}
	if req.FlutterVersion != "" {
		project.FlutterVersion = req.FlutterVersion
	}

	if err := db.DB.Save(&project).Error; err != nil {
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"project": project})
}
func ProjectDeleteHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	if err := db.DB.Where("id = ? AND user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).Delete(&db.Project{}).Error; err != nil {
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"status": "deleted"})
}
func ProjectBuildHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Platform string `json:"platform,omitempty"` // e.g., android, ios
	}
	if err := readJSON(r, &req); err != nil {
		// If no body, use default
		req.Platform = "android"
	}

	var project db.Project
	if err := db.DB.Where("id = ? AND user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).First(&project).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch project", http.StatusInternalServerError)
		return
	}

	build := db.Build{
		ProjectID: project.ID,
		Status:    "pending",
		Platform:  req.Platform,
	}

	if err := db.DB.Create(&build).Error; err != nil {
		http.Error(w, "Failed to create build", http.StatusInternalServerError)
		return
	}

	// TODO: Start actual build process

	writeJSON(w, map[string]interface{}{"build": build})
}

func BuildCancelHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}
	buildID, err := strconv.Atoi(vars["buildId"])
	if err != nil {
		http.Error(w, "Invalid build ID", http.StatusBadRequest)
		return
	}

	var build db.Build
	if err := db.DB.Joins("JOIN projects ON builds.project_id = projects.id").Where("builds.id = ? AND projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", buildID, projectID, *userInfo.Sub).First(&build).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Build not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch build", http.StatusInternalServerError)
		return
	}

	build.Status = "cancelled"
	if err := db.DB.Save(&build).Error; err != nil {
		http.Error(w, "Failed to cancel build", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"build": build})
}

func BuildsListHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var builds []db.Build
	if err := db.DB.Joins("JOIN projects ON builds.project_id = projects.id").Where("projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).Find(&builds).Error; err != nil {
		http.Error(w, "Failed to fetch builds", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"builds": builds})
}

func BuildLogsHandler(w http.ResponseWriter, r *http.Request) {
	userInfo := getUserFromContext(r.Context())
	if userInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}
	buildID, err := strconv.Atoi(vars["buildId"])
	if err != nil {
		http.Error(w, "Invalid build ID", http.StatusBadRequest)
		return
	}

	var logs []db.Log
	if err := db.DB.Joins("JOIN builds ON logs.build_id = builds.id").Joins("JOIN projects ON builds.project_id = projects.id").Where("logs.build_id = ? AND projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", buildID, projectID, *userInfo.Sub).Order("logs.line_number ASC").Find(&logs).Error; err != nil {
		http.Error(w, "Failed to fetch logs", http.StatusInternalServerError)
		return
	}

	// Convert to simple string array for backward compatibility
	logLines := make([]string, len(logs))
	for i, log := range logs {
		logLines[i] = log.Content
	}

	writeJSON(w, map[string]interface{}{"logs": logLines})
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

	vars := mux.Vars(r)
	buildID, err := strconv.Atoi(vars["buildId"])
	if err != nil {
		http.Error(w, "Invalid build ID", http.StatusBadRequest)
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

	// Simulate sending logs and store them
	logLines := []string{"Starting build...", "Compiling...", "Build successful!"}
	for i, logLine := range logLines {
		// Store log in DB
		logEntry := db.Log{
			BuildID:    uint(buildID),
			LineNumber: i + 1,
			Content:    logLine,
			Timestamp:  time.Now().Unix(),
		}
		if err := db.DB.Create(&logEntry).Error; err != nil {
			// Log error but continue
			fmt.Printf("Failed to store log: %v\n", err)
		}

		err := conn.WriteMessage(websocket.TextMessage, []byte(logLine))
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
