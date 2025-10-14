package db

import (
	"time"
)

// Build represents a build entity
type Build struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	ProjectID string `gorm:"type:uuid;index;not null" json:"project_id"`
	Status    string `gorm:"not null" json:"status"`
}
