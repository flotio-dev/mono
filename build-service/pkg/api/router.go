package api

import (
	"net/http"
	"time"

	"github.com/flotio-dev/build-service/pkg/httpx"
	"github.com/gorilla/mux"
)

func Router() *mux.Router {
	r := mux.NewRouter()

	// Public route
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpx.OK(w, map[string]any{"status": "ok", "time": time.Now()})
	}).Methods(http.MethodGet)

	mountBuilds(r)

	return r
}
