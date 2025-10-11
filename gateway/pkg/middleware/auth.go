package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/MicahParks/keyfunc"
	"github.com/golang-jwt/jwt/v4"
)

// KeycloakAuthMiddleware vérifie la présence et la validité d'un JWT signé par Keycloak
func KeycloakAuthMiddleware(jwks *keyfunc.JWKS) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Missing or invalid Authorization header"})
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")

			token, err := jwt.Parse(tokenString, jwks.Keyfunc)
			if err != nil || !token.Valid {
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Invalid token"})
				return
			}

			// Exemple : stocker les claims dans le contexte
			// ctx := context.WithValue(r.Context(), "claims", token.Claims)
			// r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		})
	}
}
