package middleware

import (
	"net/http"
)

// AuthMiddleware is a placeholder for authentication middleware
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add authentication logic here
		next.ServeHTTP(w, r)
	})
}
