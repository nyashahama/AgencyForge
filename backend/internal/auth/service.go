package auth

import (
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
)

type Service struct {
	db            *database.Pool
	jwtSecret     string
	jwtExpiry     time.Duration
	refreshExpiry time.Duration
}

type Session struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	TokenType    string      `json:"token_type"`
	ExpiresIn    int64       `json:"expires_in"`
	User         SessionUser `json:"user"`
}

type SessionUser struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	AgencyID string `json:"agency_id"`
	Role     string `json:"role"`
}

func NewService(db *database.Pool, jwtSecret string, jwtExpiry time.Duration, refreshExpiry time.Duration) *Service {
	return &Service{
		db:            db,
		jwtSecret:     jwtSecret,
		jwtExpiry:     jwtExpiry,
		refreshExpiry: refreshExpiry,
	}
}

// IssueStarterSession is intentionally lightweight. It gives the frontend a
// realistic auth contract while the persisted auth implementation is still
// being built out.
func (s *Service) IssueStarterSession(email string) (*Session, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	userID := uuid.NewString()
	agencyID := "agencyforge-starter"
	role := "owner"

	accessToken, err := GenerateAccessToken(userID, normalized, agencyID, role, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, err
	}

	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	return &Session{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.jwtExpiry / time.Second),
		User: SessionUser{
			ID:       userID,
			Email:    normalized,
			AgencyID: agencyID,
			Role:     role,
		},
	}, nil
}
