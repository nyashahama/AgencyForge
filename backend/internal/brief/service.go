package brief

import "github.com/nyashahama/AgencyForge/backend/internal/platform/database"

type Service struct {
	db *database.Pool
}

func NewService(db *database.Pool) *Service {
	return &Service{db: db}
}
