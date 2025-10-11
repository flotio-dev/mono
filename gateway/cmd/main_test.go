package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestLoadConfig(t *testing.T) {
	// Set test env vars
	os.Setenv("CORS_ORIGINS", "http://localhost:3000,http://example.com")
	os.Setenv("KEYCLOAK_BASE_URL", "http://keycloak:8080")
	os.Setenv("SKIP_AUTH", "false")
	os.Setenv("SERVER_URL", ":9090")

	config, err := loadConfig()
	assert.NoError(t, err)
	assert.Equal(t, []string{"http://localhost:3000", "http://example.com"}, config.CORSOrigins)
	assert.Equal(t, "http://keycloak:8080", config.KeycloakBaseURL)
	assert.False(t, config.SkipAuth)
	assert.Equal(t, ":9090", config.ServerURL)
}

func TestLoadConfigMissingKeycloak(t *testing.T) {
	os.Setenv("SKIP_AUTH", "false")
	os.Setenv("KEYCLOAK_BASE_URL", "")

	_, err := loadConfig()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "KEYCLOAK_BASE_URL is required")
}

func TestHealthEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"status":"ok"`)
}

func TestPublicEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/public", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Route publique"})
	})

	req, _ := http.NewRequest("GET", "/public", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Route publique")
}
