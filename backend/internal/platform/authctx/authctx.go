package authctx

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/auth"
)

var ErrMissingPrincipal = errors.New("missing auth principal")

type Principal struct {
	UserID   uuid.UUID
	AgencyID uuid.UUID
	Email    string
	Role     string
}

func FromContext(ctx context.Context) (Principal, error) {
	userID, _ := ctx.Value(auth.UserIDKey).(string)
	agencyID, _ := ctx.Value(auth.AgencyIDKey).(string)
	email, _ := ctx.Value(auth.EmailKey).(string)
	role, _ := ctx.Value(auth.RoleKey).(string)

	if userID == "" || agencyID == "" {
		return Principal{}, ErrMissingPrincipal
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return Principal{}, fmt.Errorf("%w: invalid user id", ErrMissingPrincipal)
	}

	parsedAgencyID, err := uuid.Parse(agencyID)
	if err != nil {
		return Principal{}, fmt.Errorf("%w: invalid agency id", ErrMissingPrincipal)
	}

	return Principal{
		UserID:   parsedUserID,
		AgencyID: parsedAgencyID,
		Email:    email,
		Role:     role,
	}, nil
}
