package client

import "errors"

var (
	ErrValidation      = errors.New("validation error")
	ErrClientNotFound  = errors.New("client not found")
	ErrClientSlugTaken = errors.New("client slug already exists")
)
