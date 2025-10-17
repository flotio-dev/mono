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
	Logs      string  `gorm:"type:text" json:"logs"`
	APKURL    string  `json:"apk_url"`
}

// Env model
type Env struct {
	gorm.Model
	ProjectID uint    `json:"project_id"`
	Project   Project `json:"project"`
	Key       string  `json:"key"`
	Value     string  `json:"value"`
}
