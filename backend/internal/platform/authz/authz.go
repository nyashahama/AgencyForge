package authz

import (
	"errors"
	"fmt"
	"strings"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
)

const (
	RoleOwner  = "owner"
	RoleAdmin  = "admin"
	RoleMember = "member"
	RoleViewer = "viewer"
)

var ErrForbidden = errors.New("forbidden")

func RequireWriter(principal authctx.Principal) error {
	return requireRole(principal.Role, RoleOwner, RoleAdmin, RoleMember)
}

func RequireAdmin(principal authctx.Principal) error {
	return requireRole(principal.Role, RoleOwner, RoleAdmin)
}

func requireRole(role string, allowed ...string) error {
	normalizedRole := strings.ToLower(strings.TrimSpace(role))
	for _, candidate := range allowed {
		if normalizedRole == candidate {
			return nil
		}
	}

	if normalizedRole == "" {
		normalizedRole = "unknown"
	}

	return fmt.Errorf("%w: role %s is not allowed", ErrForbidden, normalizedRole)
}
