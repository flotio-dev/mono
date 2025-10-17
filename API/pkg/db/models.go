package db

import (
	"gorm.io/gorm"
)

// User model - additional info beyond Keycloak
type User struct {
	gorm.Model
	KeycloakID string    `gorm:"uniqueIndex" json:"keycloak_id"`
	Email      string    `gorm:"uniqueIndex" json:"email"`
	Username   string    `json:"username"`
	Projects   []Project `gorm:"foreignKey:UserID" json:"projects"`
}

// Project model
type Project struct {
	gorm.Model
	Name    string  `json:"name"`
	GitRepo string  `json:"git_repo"`
	UserID  uint    `json:"user_id"`
	User    User    `json:"user"`
	Builds  []Build `gorm:"foreignKey:ProjectID" json:"builds"`
	Envs    []Env   `gorm:"foreignKey:ProjectID" json:"envs"`
}

// Build model
type Build struct {
	gorm.Model
	ProjectID uint    `json:"project_id"`
	Project   Project `json:"project"`
	Status    string  `json:"status"` // pending, running, success, failed
	APKURL    string  `json:"apk_url"`
	Logs      []Log   `gorm:"foreignKey:BuildID" json:"logs"`
}

// Log model - stores build logs line by line
type Log struct {
	gorm.Model
	BuildID    uint   `json:"build_id"`
	Build      Build  `json:"build"`
	LineNumber  int    `json:"line_number"`
	Content    string `json:"content"`
	Timestamp  int64  `json:"timestamp"` // Unix timestamp
}

// Env model
type Env struct {
	gorm.Model
	ProjectID uint    `json:"project_id"`
	Project   Project `json:"project"`
	Key       string  `json:"key"`
	Value     string  `json:"value"`
}
