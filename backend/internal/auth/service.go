package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"

	"github.com/nyashahama/AgencyForge/backend/db/gen"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
)

type Service struct {
	db            *database.Pool
	queries       *dbgen.Queries
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
	Name     string `json:"name"`
	Email    string `json:"email"`
	AgencyID string `json:"agency_id"`
	Agency   string `json:"agency"`
	Role     string `json:"role"`
}

type authIdentity struct {
	ID               uuid.UUID
	AgencyID         uuid.UUID
	Name             string
	Email            string
	Role             string
	AgencyName       string
	MembershipStatus string
}

func NewService(db *database.Pool, jwtSecret string, jwtExpiry time.Duration, refreshExpiry time.Duration) *Service {
	var queries *dbgen.Queries
	if db != nil {
		queries = dbgen.New(db)
	}

	return &Service{
		db:            db,
		queries:       queries,
		jwtSecret:     jwtSecret,
		jwtExpiry:     jwtExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (s *Service) Register(ctx context.Context, name string, email string, password string) (*Session, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("auth service is not configured with a database")
	}

	normalizedName := strings.TrimSpace(name)
	normalizedEmail := normalizeEmail(email)
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Session, error) {
		queries := s.queries.WithTx(tx)
		agency, err := queries.CreateAgency(ctx, dbgen.CreateAgencyParams{
			Name: normalizedName + " Agency",
			Slug: agencySlug(normalizedName),
		})
		if err != nil {
			if isUniqueViolation(err) {
				agency, err = queries.CreateAgency(ctx, dbgen.CreateAgencyParams{
					Name: normalizedName + " Agency",
					Slug: agencySlug(normalizedName + "-" + uuid.NewString()[:8]),
				})
			}
			if err != nil {
				return nil, fmt.Errorf("create agency: %w", err)
			}
		}

		user, err := queries.CreateUser(ctx, dbgen.CreateUserParams{
			AgencyID:     agency.ID,
			Name:         normalizedName,
			Email:        normalizedEmail,
			PasswordHash: hashedPassword,
			Role:         "owner",
		})
		if err != nil {
			if isUniqueViolation(err) {
				return nil, ErrEmailTaken
			}
			return nil, fmt.Errorf("create user: %w", err)
		}

		if _, err := queries.CreateAgencyMembership(ctx, dbgen.CreateAgencyMembershipParams{
			AgencyID: agency.ID,
			UserID:   user.ID,
			Role:     "owner",
			Status:   "active",
		}); err != nil {
			return nil, fmt.Errorf("create membership: %w", err)
		}

		return s.issueSession(ctx, queries, authIdentity{
			ID:               user.ID,
			AgencyID:         agency.ID,
			Name:             user.Name,
			Email:            user.Email,
			Role:             user.Role,
			AgencyName:       agency.Name,
			MembershipStatus: "active",
		})
	})
}

func (s *Service) Login(ctx context.Context, email string, password string) (*Session, error) {
	if s.queries == nil {
		return nil, errors.New("auth service is not configured with a database")
	}

	user, err := s.queries.GetUserAuthByEmail(ctx, normalizeEmail(email))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}

	if user.MembershipStatus != "active" {
		return nil, ErrInactiveMembership
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.issueSession(ctx, s.queries, authIdentityFromEmailRow(user))
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (*Session, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("auth service is not configured with a database")
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Session, error) {
		queries := s.queries.WithTx(tx)
		record, err := queries.GetRefreshToken(ctx, hashRefreshToken(refreshToken))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrInvalidRefreshToken
			}
			return nil, fmt.Errorf("get refresh token: %w", err)
		}

		if time.Now().After(record.ExpiresAt) {
			if err := queries.DeleteRefreshToken(ctx, record.Token); err != nil {
				return nil, fmt.Errorf("delete expired refresh token: %w", err)
			}
			return nil, ErrExpiredRefreshToken
		}

		user, err := queries.GetUserAuthByID(ctx, record.UserID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrUserNotFound
			}
			return nil, fmt.Errorf("get user by id: %w", err)
		}

		if user.MembershipStatus != "active" {
			return nil, ErrInactiveMembership
		}

		if err := queries.DeleteRefreshToken(ctx, record.Token); err != nil {
			return nil, fmt.Errorf("rotate refresh token: %w", err)
		}

		return s.issueSession(ctx, queries, authIdentityFromIDRow(user))
	})
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	if s.queries == nil {
		return errors.New("auth service is not configured with a database")
	}

	if err := s.queries.DeleteRefreshToken(ctx, hashRefreshToken(refreshToken)); err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}

	return nil
}

func (s *Service) CurrentUser(ctx context.Context, userID string) (*SessionUser, error) {
	if s.queries == nil {
		return nil, errors.New("auth service is not configured with a database")
	}

	parsedID, err := uuid.Parse(strings.TrimSpace(userID))
	if err != nil {
		return nil, ErrUserNotFound
	}

	user, err := s.queries.GetUserAuthByID(ctx, parsedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get current user: %w", err)
	}

	if user.MembershipStatus != "active" {
		return nil, ErrInactiveMembership
	}

	currentUser := buildSessionUser(authIdentityFromIDRow(user))
	return &currentUser, nil
}

func (s *Service) issueSession(ctx context.Context, queries authQuerier, user authIdentity) (*Session, error) {
	accessToken, err := GenerateAccessToken(user.ID.String(), user.Email, user.AgencyID.String(), user.Role, s.jwtSecret, s.jwtExpiry)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	if _, err := queries.CreateRefreshToken(ctx, dbgen.CreateRefreshTokenParams{
		Token:     hashRefreshToken(refreshToken),
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}); err != nil {
		return nil, fmt.Errorf("create refresh token: %w", err)
	}

	return &Session{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(s.jwtExpiry / time.Second),
		User:         buildSessionUser(user),
	}, nil
}

func hashRefreshToken(refreshToken string) string {
	digest := sha256.Sum256([]byte(strings.TrimSpace(refreshToken)))
	return hex.EncodeToString(digest[:])
}

type authQuerier interface {
	CreateRefreshToken(context.Context, dbgen.CreateRefreshTokenParams) (dbgen.RefreshToken, error)
}

func authIdentityFromEmailRow(user dbgen.GetUserAuthByEmailRow) authIdentity {
	return authIdentity{
		ID:               user.ID,
		AgencyID:         user.AgencyID,
		Name:             user.Name,
		Email:            user.Email,
		Role:             user.Role,
		AgencyName:       user.AgencyName,
		MembershipStatus: user.MembershipStatus,
	}
}

func authIdentityFromIDRow(user dbgen.GetUserAuthByIDRow) authIdentity {
	return authIdentity{
		ID:               user.ID,
		AgencyID:         user.AgencyID,
		Name:             user.Name,
		Email:            user.Email,
		Role:             user.Role,
		AgencyName:       user.AgencyName,
		MembershipStatus: user.MembershipStatus,
	}
}

func buildSessionUser(user authIdentity) SessionUser {
	return SessionUser{
		ID:       user.ID.String(),
		Name:     user.Name,
		Email:    user.Email,
		AgencyID: user.AgencyID.String(),
		Agency:   user.AgencyName,
		Role:     user.Role,
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func hashPassword(password string) (string, error) {
	if len(password) < 8 {
		return "", ErrWeakPassword
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}

	return string(hashedPassword), nil
}

var slugPattern = regexp.MustCompile(`[^a-z0-9]+`)

func agencySlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = slugPattern.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "agency"
	}
	return slug
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
