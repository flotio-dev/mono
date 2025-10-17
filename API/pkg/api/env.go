package api

import (
	"net/http"
	"strconv"

	"github.com/flotio-dev/api/pkg/db"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// Env handlers
func EnvGetHandler(w http.ResponseWriter, r *http.Request) {
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

	var envs []db.Env
	if err := db.DB.Joins("JOIN projects ON envs.project_id = projects.id").Where("projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).Find(&envs).Error; err != nil {
		http.Error(w, "Failed to fetch envs", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"envs": envs})
}
func EnvPostHandler(w http.ResponseWriter, r *http.Request) {
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
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := readJSON(r, &req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verify project ownership
	var project db.Project
	if err := db.DB.Where("id = ? AND user_id = (SELECT id FROM users WHERE keycloak_id = ?)", projectID, *userInfo.Sub).First(&project).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch project", http.StatusInternalServerError)
		return
	}

	env := db.Env{
		ProjectID: project.ID,
		Key:       req.Key,
		Value:     req.Value,
	}

	if err := db.DB.Create(&env).Error; err != nil {
		http.Error(w, "Failed to create env", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"env": env})
}
func EnvDeleteHandler(w http.ResponseWriter, r *http.Request) {
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
		Key string `json:"key"`
	}
	if err := readJSON(r, &req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := db.DB.Joins("JOIN projects ON envs.project_id = projects.id").Where("envs.key = ? AND projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", req.Key, projectID, *userInfo.Sub).Delete(&db.Env{}).Error; err != nil {
		http.Error(w, "Failed to delete env", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{"status": "deleted"})
}
func EnvPutHandler(w http.ResponseWriter, r *http.Request) {
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
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := readJSON(r, &req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var env db.Env
	if err := db.DB.Joins("JOIN projects ON envs.project_id = projects.id").Where("envs.key = ? AND projects.id = ? AND projects.user_id = (SELECT id FROM users WHERE keycloak_id = ?)", req.Key, projectID, *userInfo.Sub).First(&env).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Env not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch env", http.StatusInternalServerError)
		return
	}

	env.Value = req.Value

	if err := db.DB.Save(&env).Error; err != nil {
		http.Error(w, "Failed to update env", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{"env": env})
}
