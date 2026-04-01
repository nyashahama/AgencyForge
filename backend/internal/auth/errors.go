package auth

import "errors"

var (
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrEmailTaken          = errors.New("email already registered")
	ErrWeakPassword        = errors.New("password must be at least 8 characters long")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	ErrExpiredRefreshToken = errors.New("refresh token expired")
	ErrUserNotFound        = errors.New("user not found")
	ErrInactiveMembership  = errors.New("inactive membership")
)
