package api

import (
	"fmt"
	"net/http"

	"github.com/flotio-dev/build-service/pkg/client"
	"github.com/flotio-dev/build-service/pkg/httpx"
	"github.com/flotio-dev/build-service/pkg/middleware"
	"github.com/gorilla/mux"
)

var projectClient *client.ProjectServiceClient

func InitProjectClient(baseURL string) {
	projectClient = client.NewProjectServiceClient(baseURL)
}

func mountBuilds(router *mux.Router) {
	// POST /:projectId/build/start
	router.HandleFunc("/{projectId}/build/start", func(w http.ResponseWriter, r *http.Request) {
		projectID := mux.Vars(r)["projectId"]

		// Get authenticated user from context
		sub, ok := middleware.GetValue[string](r, "sub")
		if !ok {
			httpx.Unauthorized(w, "user not authenticated")
			return
		}

		token, ok := middleware.GetValue[string](r, "token")
		if !ok {
			httpx.Unauthorized(w, "token not found")
			return
		}

		// Get project data from project-service
		project, err := projectClient.GetProject(projectID, "Bearer "+token)
		if err != nil {
			httpx.InternalError(w, fmt.Sprintf("failed to get project: %v", err))
			return
		}

		// Additional validation: ensure project belongs to authenticated user
		if project.UserID != sub {
			httpx.Forbidden(w, "project does not belong to authenticated user")
			return
		}

		// Validate project has required fields
		if project.Platform != "android" {
			httpx.BadRequest(w, "only android platform supported")
			return
		}

		// TODO: Implement actual build logic
		// For now, just return success
		httpx.OK(w, map[string]any{
			"message":    "build started",
			"project_id": projectID,
			"platform":   project.Platform,
			"user_id":    sub,
		})
	}).Methods(http.MethodPost)

	// DELETE /:projectId/build/cancel
	router.HandleFunc("/{projectId}/build/cancel", func(w http.ResponseWriter, r *http.Request) {
		projectID := mux.Vars(r)["projectId"]

		// Get authenticated user from context
		sub, ok := middleware.GetValue[string](r, "sub")
		if !ok {
			httpx.Unauthorized(w, "user not authenticated")
			return
		}

		token, ok := middleware.GetValue[string](r, "token")
		if !ok {
			httpx.Unauthorized(w, "token not found")
			return
		}

		// Get project data to validate ownership
		project, err := projectClient.GetProject(projectID, "Bearer "+token)
		if err != nil {
			httpx.InternalError(w, fmt.Sprintf("failed to get project: %v", err))
			return
		}

		if project.UserID != sub {
			httpx.Forbidden(w, "project does not belong to authenticated user")
			return
		}

		// TODO: Implement cancel logic
		httpx.OK(w, map[string]any{
			"message":    "build cancelled",
			"project_id": projectID,
			"user_id":    sub,
		})
	}).Methods(http.MethodDelete)

	// GET /:projectId/build/logs
	router.HandleFunc("/{projectId}/build/logs", func(w http.ResponseWriter, r *http.Request) {
		projectID := mux.Vars(r)["projectId"]

		// Get authenticated user from context
		sub, ok := middleware.GetValue[string](r, "sub")
		if !ok {
			httpx.Unauthorized(w, "user not authenticated")
			return
		}

		token, ok := middleware.GetValue[string](r, "token")
		if !ok {
			httpx.Unauthorized(w, "token not found")
			return
		}

		// Get project data to validate ownership
		project, err := projectClient.GetProject(projectID, "Bearer "+token)
		if err != nil {
			httpx.InternalError(w, fmt.Sprintf("failed to get project: %v", err))
			return
		}

		if project.UserID != sub {
			httpx.Forbidden(w, "project does not belong to authenticated user")
			return
		}

		// TODO: Implement logs retrieval
		httpx.OK(w, map[string]any{
			"logs":       []string{"build log line 1", "build log line 2"},
			"project_id": projectID,
			"user_id":    sub,
		})
	}).Methods(http.MethodGet)

	// GET /api/builds
	router.HandleFunc("/builds", func(w http.ResponseWriter, r *http.Request) {
		// Logic to get builds
		httpx.OK(w, map[string]any{"builds": []string{"build1", "build2"}})
	}).Methods(http.MethodGet)

	// POST /api/builds
	router.HandleFunc("/builds", func(w http.ResponseWriter, r *http.Request) {
		// Logic to create build
		httpx.Created(w, map[string]any{"message": "Build created"})
	}).Methods(http.MethodPost)
}
