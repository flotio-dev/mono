package db

import (
	"time"
)

// Log represents a log entity
type Log struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	BuildID string `gorm:"type:uuid;index;not null" json:"build_id"`
	Message string `gorm:"not null" json:"message"`
}
