package invite

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"

	dbgen "github.com/nyashahama/AgencyForge/backend/db/gen"
	"github.com/nyashahama/AgencyForge/backend/internal/auth"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authz"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/email"
)

const inviteExpiry = 7 * 24 * time.Hour

type Service struct {
	db            *database.Pool
	queries       *dbgen.Queries
	mailer        email.Mailer
	inviteBaseURL string
	jwtSecret     string
	jwtExpiry     time.Duration
	refreshExpiry time.Duration
}

type Invite struct {
	ID            string     `json:"id"`
	Email         string     `json:"email"`
	Role          string     `json:"role"`
	Status        string     `json:"status"`
	InvitedByName string     `json:"invited_by_name,omitempty"`
	AcceptedAt    *time.Time `json:"accepted_at,omitempty"`
	RevokedAt     *time.Time `json:"revoked_at,omitempty"`
	ExpiresAt     time.Time  `json:"expires_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

type PublicInvite struct {
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	ExpiresAt time.Time `json:"expires_at"`
}

type CreateInput struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type AcceptInput struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

func NewService(
	db *database.Pool,
	mailer email.Mailer,
	inviteBaseURL string,
	jwtSecret string,
	jwtExpiry time.Duration,
	refreshExpiry time.Duration,
) *Service {
	var queries *dbgen.Queries
	if db != nil {
		queries = dbgen.New(db)
	}
	if mailer == nil {
		mailer = email.NewNoopMailer()
	}

	return &Service{
		db:            db,
		queries:       queries,
		mailer:        mailer,
		inviteBaseURL: strings.TrimRight(inviteBaseURL, "/"),
		jwtSecret:     jwtSecret,
		jwtExpiry:     jwtExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (s *Service) List(ctx context.Context, principal authctx.Principal) ([]Invite, error) {
	if s.queries == nil {
		return nil, errors.New("invite service is not configured with a database")
	}
	if err := authz.RequireAdmin(principal); err != nil {
		return nil, err
	}

	rows, err := s.queries.ListInvitesByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, fmt.Errorf("list invites: %w", err)
	}

	items := make([]Invite, 0, len(rows))
	for _, row := range rows {
		items = append(items, inviteFromListRow(row))
	}
	return items, nil
}

func (s *Service) Create(ctx context.Context, principal authctx.Principal, input CreateInput) (*Invite, error) {
	if s.queries == nil {
		return nil, errors.New("invite service is not configured with a database")
	}
	if err := authz.RequireAdmin(principal); err != nil {
		return nil, err
	}

	normalizedEmail := normalizeEmail(input.Email)
	role := normalizeRole(input.Role)
	if normalizedEmail == "" {
		return nil, ErrInvalidEmail
	}
	if err := validateRole(role); err != nil {
		return nil, err
	}
	if _, err := s.queries.GetUserAuthByEmail(ctx, normalizedEmail); err == nil {
		return nil, ErrInviteEmailUsed
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("check invite email: %w", err)
	}

	token, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate invite token: %w", err)
	}

	record, err := s.queries.CreateInvite(ctx, dbgen.CreateInviteParams{
		AgencyID:        principal.AgencyID,
		Email:           normalizedEmail,
		Role:            role,
		TokenHash:       hashInviteToken(token),
		InvitedByUserID: principal.UserID,
		ExpiresAt:       time.Now().UTC().Add(inviteExpiry),
	})
	if err != nil {
		switch {
		case isUniqueViolation(err):
			return nil, ErrInviteAlreadyActive
		default:
			return nil, fmt.Errorf("create invite: %w", err)
		}
	}

	if err := s.mailer.SendInvite(ctx, email.InviteMessage{
		To:        normalizedEmail,
		Role:      role,
		AcceptURL: s.acceptURL(token),
	}); err != nil {
		return nil, fmt.Errorf("send invite email: %w", err)
	}

	result := inviteFromRecord(record)
	return &result, nil
}

func (s *Service) Resend(ctx context.Context, principal authctx.Principal, inviteID uuid.UUID) (*Invite, error) {
	if s.queries == nil {
		return nil, errors.New("invite service is not configured with a database")
	}
	if err := authz.RequireAdmin(principal); err != nil {
		return nil, err
	}

	record, err := s.queries.GetInviteByIDAndAgency(ctx, dbgen.GetInviteByIDAndAgencyParams{
		ID:       inviteID,
		AgencyID: principal.AgencyID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInviteNotFound
		}
		return nil, fmt.Errorf("get invite: %w", err)
	}

	if inviteAccepted(record) {
		return nil, ErrInviteAccepted
	}
	if inviteRevoked(record) {
		return nil, ErrInviteRevoked
	}

	token, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate invite token: %w", err)
	}

	record, err = s.queries.UpdateInviteToken(ctx, dbgen.UpdateInviteTokenParams{
		ID:        inviteID,
		TokenHash: hashInviteToken(token),
		ExpiresAt: time.Now().UTC().Add(inviteExpiry),
	})
	if err != nil {
		return nil, fmt.Errorf("update invite token: %w", err)
	}

	if err := s.mailer.SendInvite(ctx, email.InviteMessage{
		To:        record.Email,
		Role:      record.Role,
		AcceptURL: s.acceptURL(token),
	}); err != nil {
		return nil, fmt.Errorf("send invite email: %w", err)
	}

	result := inviteFromRecord(record)
	return &result, nil
}

func (s *Service) Revoke(ctx context.Context, principal authctx.Principal, inviteID uuid.UUID) error {
	if s.queries == nil {
		return errors.New("invite service is not configured with a database")
	}
	if err := authz.RequireAdmin(principal); err != nil {
		return err
	}

	record, err := s.queries.GetInviteByIDAndAgency(ctx, dbgen.GetInviteByIDAndAgencyParams{
		ID:       inviteID,
		AgencyID: principal.AgencyID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInviteNotFound
		}
		return fmt.Errorf("get invite: %w", err)
	}
	if inviteAccepted(record) {
		return ErrInviteAccepted
	}
	if inviteRevoked(record) {
		return ErrInviteRevoked
	}

	if err := s.queries.RevokeInvite(ctx, inviteID); err != nil {
		return fmt.Errorf("revoke invite: %w", err)
	}

	return nil
}

func (s *Service) Inspect(ctx context.Context, token string) (*PublicInvite, error) {
	record, err := s.lookupInviteByToken(ctx, token)
	if err != nil {
		return nil, err
	}

	result := publicInviteFromRecord(record)
	return &result, nil
}

func (s *Service) Accept(ctx context.Context, token string, input AcceptInput) (*auth.Session, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("invite service is not configured with a database")
	}

	name := strings.TrimSpace(input.Name)
	password := strings.TrimSpace(input.Password)
	if name == "" {
		return nil, ErrInvalidName
	}
	if len(password) < 8 {
		return nil, ErrWeakPassword
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*auth.Session, error) {
		queries := s.queries.WithTx(tx)
		record, err := queries.GetInviteByTokenHash(ctx, hashInviteToken(token))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrInviteNotFound
			}
			return nil, fmt.Errorf("get invite by token: %w", err)
		}

		if err := validateInviteState(record); err != nil {
			return nil, err
		}

		if _, err := queries.GetUserAuthByEmail(ctx, record.Email); err == nil {
			return nil, ErrInviteEmailUsed
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("check invite email: %w", err)
		}

		hashedPassword, err := hashPassword(password)
		if err != nil {
			return nil, err
		}

		user, err := queries.CreateUser(ctx, dbgen.CreateUserParams{
			AgencyID:     record.AgencyID,
			Name:         name,
			Email:        record.Email,
			PasswordHash: hashedPassword,
			Role:         record.Role,
		})
		if err != nil {
			if isUniqueViolation(err) {
				return nil, ErrInviteEmailUsed
			}
			return nil, fmt.Errorf("create invited user: %w", err)
		}

		if _, err := queries.CreateAgencyMembership(ctx, dbgen.CreateAgencyMembershipParams{
			AgencyID: record.AgencyID,
			UserID:   user.ID,
			Role:     record.Role,
			Status:   "active",
		}); err != nil {
			return nil, fmt.Errorf("create agency membership: %w", err)
		}

		if err := queries.AcceptInvite(ctx, record.ID); err != nil {
			return nil, fmt.Errorf("accept invite: %w", err)
		}

		userAuth, err := queries.GetUserAuthByID(ctx, user.ID)
		if err != nil {
			return nil, fmt.Errorf("load invited user auth: %w", err)
		}

		accessToken, err := auth.GenerateAccessToken(
			userAuth.ID.String(),
			userAuth.Email,
			userAuth.AgencyID.String(),
			userAuth.Role,
			s.jwtSecret,
			s.jwtExpiry,
		)
		if err != nil {
			return nil, fmt.Errorf("generate access token: %w", err)
		}

		refreshToken, err := auth.GenerateRefreshToken()
		if err != nil {
			return nil, fmt.Errorf("generate refresh token: %w", err)
		}

		if _, err := queries.CreateRefreshToken(ctx, dbgen.CreateRefreshTokenParams{
			Token:     hashRefreshToken(refreshToken),
			UserID:    userAuth.ID,
			ExpiresAt: time.Now().UTC().Add(s.refreshExpiry),
		}); err != nil {
			return nil, fmt.Errorf("create refresh token: %w", err)
		}

		return &auth.Session{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			TokenType:    "Bearer",
			ExpiresIn:    int64(s.jwtExpiry / time.Second),
			User: auth.SessionUser{
				ID:       userAuth.ID.String(),
				Name:     userAuth.Name,
				Email:    userAuth.Email,
				AgencyID: userAuth.AgencyID.String(),
				Agency:   userAuth.AgencyName,
				Role:     userAuth.Role,
			},
		}, nil
	})
}

func (s *Service) lookupInviteByToken(ctx context.Context, token string) (dbgen.OperatorInvite, error) {
	if s.queries == nil {
		return dbgen.OperatorInvite{}, errors.New("invite service is not configured with a database")
	}

	record, err := s.queries.GetInviteByTokenHash(ctx, hashInviteToken(token))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return dbgen.OperatorInvite{}, ErrInviteNotFound
		}
		return dbgen.OperatorInvite{}, fmt.Errorf("get invite by token: %w", err)
	}

	if err := validateInviteState(record); err != nil {
		return dbgen.OperatorInvite{}, err
	}

	return record, nil
}

func validateInviteState(record dbgen.OperatorInvite) error {
	switch {
	case inviteAccepted(record):
		return ErrInviteAccepted
	case inviteRevoked(record):
		return ErrInviteRevoked
	case record.ExpiresAt.Before(time.Now().UTC()):
		return ErrInviteExpired
	default:
		return nil
	}
}

func inviteFromListRow(row dbgen.ListInvitesByAgencyRow) Invite {
	return Invite{
		ID:            row.ID.String(),
		Email:         row.Email,
		Role:          row.Role,
		Status:        inviteStatus(nullableTime(row.AcceptedAt), nullableTime(row.RevokedAt), row.ExpiresAt),
		InvitedByName: row.InvitedByName,
		AcceptedAt:    nullableTime(row.AcceptedAt),
		RevokedAt:     nullableTime(row.RevokedAt),
		ExpiresAt:     row.ExpiresAt,
		CreatedAt:     row.CreatedAt,
	}
}

func inviteFromRecord(record dbgen.OperatorInvite) Invite {
	return Invite{
		ID:         record.ID.String(),
		Email:      record.Email,
		Role:       record.Role,
		Status:     inviteStatus(nullableTime(record.AcceptedAt), nullableTime(record.RevokedAt), record.ExpiresAt),
		AcceptedAt: nullableTime(record.AcceptedAt),
		RevokedAt:  nullableTime(record.RevokedAt),
		ExpiresAt:  record.ExpiresAt,
		CreatedAt:  record.CreatedAt,
	}
}

func publicInviteFromRecord(record dbgen.OperatorInvite) PublicInvite {
	return PublicInvite{
		Email:     record.Email,
		Role:      record.Role,
		Status:    inviteStatus(nullableTime(record.AcceptedAt), nullableTime(record.RevokedAt), record.ExpiresAt),
		ExpiresAt: record.ExpiresAt,
	}
}

func inviteStatus(acceptedAt *time.Time, revokedAt *time.Time, expiresAt time.Time) string {
	switch {
	case acceptedAt != nil:
		return "accepted"
	case revokedAt != nil:
		return "revoked"
	case expiresAt.Before(time.Now().UTC()):
		return "expired"
	default:
		return "pending"
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func normalizeRole(role string) string {
	return strings.ToLower(strings.TrimSpace(role))
}

func validateRole(role string) error {
	switch role {
	case authz.RoleOwner, authz.RoleAdmin, authz.RoleMember, authz.RoleViewer:
		return nil
	default:
		return ErrInvalidRole
	}
}

func hashInviteToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}

func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}

func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hashed), nil
}

func inviteAccepted(record dbgen.OperatorInvite) bool {
	return record.AcceptedAt.Valid
}

func inviteRevoked(record dbgen.OperatorInvite) bool {
	return record.RevokedAt.Valid
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (s *Service) acceptURL(token string) string {
	return s.inviteBaseURL + "/invite/" + token
}

func nullableTime(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}

	timestamp := value.Time
	return &timestamp
}
