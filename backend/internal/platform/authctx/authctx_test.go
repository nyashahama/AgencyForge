package authctx

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/auth"
)

func TestFromContext(t *testing.T) {
	userID := uuid.New()
	agencyID := uuid.New()

	ctx := context.Background()
	ctx = context.WithValue(ctx, auth.UserIDKey, userID.String())
	ctx = context.WithValue(ctx, auth.AgencyIDKey, agencyID.String())
	ctx = context.WithValue(ctx, auth.EmailKey, "demo@agencyforge.test")
	ctx = context.WithValue(ctx, auth.RoleKey, "owner")

	principal, err := FromContext(ctx)
	if err != nil {
		t.Fatalf("FromContext() error = %v", err)
	}

	if principal.UserID != userID {
		t.Fatalf("UserID = %s, want %s", principal.UserID, userID)
	}

	if principal.AgencyID != agencyID {
		t.Fatalf("AgencyID = %s, want %s", principal.AgencyID, agencyID)
	}
}
