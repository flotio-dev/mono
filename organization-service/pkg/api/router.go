package api

import (
	"net/http"
	"time"

	"os"

	"github.com/flotio-dev/organization-service/pkg/httpx"
	"github.com/gorilla/mux"
)

func Router() *mux.Router {
	r := mux.NewRouter()

	// Public route
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpx.OK(w, map[string]any{"status": "ok", "time": time.Now()})
	}).Methods(http.MethodGet)

	keycloakBaseURL := os.Getenv("KEYCLOAK_BASE_URL")
	keycloakRealm := os.Getenv("KEYCLOAK_REALM")

	mountOrganizations(r, keycloakBaseURL, keycloakRealm)

	return r
}
