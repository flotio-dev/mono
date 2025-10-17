package api

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"github.com/flotio-dev/api/pkg/db"
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
		Name    string `json:"name"`
		GitRepo string `json:"git_repo"`
	}
	if err := readJSON(r, &req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	project := db.Project{
		Name:    req.Name,
		GitRepo: req.GitRepo,
		UserID:  user.ID,
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
		Name    string `json:"name"`
		GitRepo string `json:"git_repo"`
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

	project.Name = req.Name
	project.GitRepo = req.GitRepo

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

	var build db.Build
	if err := db.DB.Joins("JOIN projects ON builds.project_id = projects.id").Where("builds.id = ? AND projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", buildID, projectID, *userInfo.Sub).First(&build).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Build not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch build", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"logs": build.Logs})
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
