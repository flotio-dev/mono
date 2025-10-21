package api

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"

	v1 "github.com/flotio-dev/api/pkg/api/v1"
)

func Router() http.Handler {
	r := mux.NewRouter()

	// Public auth routes
	r.HandleFunc("/auth/register", RegisterHandler).Methods("POST")
	r.HandleFunc("/auth/login", LoginHandler).Methods("POST")
	r.HandleFunc("/auth/github/callback", GithubCallbackHandler).Methods("GET")

	// Health check
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte("ok"))
	}).Methods("GET")

	// Protected routes
	protected := r.PathPrefix("/").Subrouter()
	protected.Use(AuthMiddleware)

	// Protected auth routes
	protected.HandleFunc("/auth/@me", MeGetHandler).Methods("GET")
	protected.HandleFunc("/auth/@me", MePutHandler).Methods("PUT")

	// Github route (protected)
	protected.HandleFunc("/github", GithubHandler).Methods("GET")

	// Env routes (by project)
	protected.HandleFunc("/project/{id}/env", EnvGetHandler).Methods("GET")
	protected.HandleFunc("/project/{id}/env", EnvPostHandler).Methods("POST")
	protected.HandleFunc("/project/{id}/envs", EnvGetHandler).Methods("GET")
	protected.HandleFunc("/project/{id}/env/{envId}", EnvGetByIdHandler).Methods("GET")
	protected.HandleFunc("/project/{id}/env/{envId}", EnvPutByIdHandler).Methods("PUT")
	protected.HandleFunc("/project/{id}/env/{envId}", EnvDeleteByIdHandler).Methods("DELETE")

	// Project routes
	protected.HandleFunc("/project", ProjectsGetHandler).Methods("GET")
	protected.HandleFunc("/project", ProjectCreateHandler).Methods("POST")
	protected.HandleFunc("/project/{id}", ProjectGetHandler).Methods("GET")
	protected.HandleFunc("/project/{id}", ProjectPutHandler).Methods("PUT")
	protected.HandleFunc("/project/{id}", ProjectDeleteHandler).Methods("DELETE")
	protected.HandleFunc("/project/{id}/build", ProjectBuildHandler).Methods("POST")

	// Build routes
	protected.HandleFunc("/project/{id}/build/{buildId}/cancel", BuildCancelHandler).Methods("PUT")
	protected.HandleFunc("/project/{id}/builds", BuildsListHandler).Methods("GET")
	protected.HandleFunc("/project/{id}/build/{buildId}/logs", BuildLogsHandler).Methods("GET")
	protected.HandleFunc("/project/{id}/build/{buildId}/logs/ws", BuildLogsWSHandler).Methods("GET")
	protected.HandleFunc("/project/{id}/build/{buildId}/download", BuildDownloadHandler).Methods("GET")

	// Github routes
	fmt.Printf("Webhook secret: '%s'\n", os.Getenv("GITHUB_WEBHOOK_SECRET"))
	githubController := v1.NewGithubController([]byte(os.Getenv("GITHUB_WEBHOOK_SECRET")))
	protected.HandleFunc("/github/webhooks", githubController.HandleWebhook)

	return r
}
