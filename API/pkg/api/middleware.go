package api

import (
	"context"
	"net/http"
	"os"

	"github.com/Nerzal/gocloak/v13"
)

type contextKey string

const userContextKey contextKey = "user"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			next.ServeHTTP(w, r)
			return
		}
		token := authHeader[7:]

		client := getKeycloakClient()
		ctx := context.Background()
		realm := os.Getenv("KEYCLOAK_REALM")

		// Get user info from token
		userInfo, err := client.GetUserInfo(ctx, token, realm)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		// Add user info to context
		ctxWithUser := context.WithValue(r.Context(), userContextKey, userInfo)
		r = r.WithContext(ctxWithUser)

		next.ServeHTTP(w, r)
	})
}

func getUserFromContext(ctx context.Context) *gocloak.UserInfo {
	if user, ok := ctx.Value(userContextKey).(*gocloak.UserInfo); ok {
		return user
	}
	return nil
}
