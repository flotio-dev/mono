package db

import (
	"time"
)

// ProjectStats stocke des statistiques journalières
type ProjectStats struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	ProjectID   string    `gorm:"type:uuid;index;not null" json:"project_id"`
	Day         time.Time `gorm:"type:date;index" json:"day"`
	UniqueOpens int       `gorm:"not null;default:0" json:"unique_opens"`
	Opens       int       `gorm:"not null;default:0" json:"opens"`
}
