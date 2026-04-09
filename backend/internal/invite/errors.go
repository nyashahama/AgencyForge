package invite

import "errors"

var (
	ErrInviteNotFound      = errors.New("invite not found")
	ErrInviteExpired       = errors.New("invite expired")
	ErrInviteRevoked       = errors.New("invite revoked")
	ErrInviteAccepted      = errors.New("invite accepted")
	ErrInviteEmailUsed     = errors.New("invite email already in use")
	ErrInviteAlreadyActive = errors.New("invite already active for email")
	ErrInvalidEmail        = errors.New("invalid email")
	ErrInvalidRole         = errors.New("invalid role")
	ErrInvalidName         = errors.New("invalid name")
	ErrWeakPassword        = errors.New("password must be at least 8 characters long")
)
