package portal

import "errors"

var (
	ErrValidation      = errors.New("validation error")
	ErrPortalNotFound  = errors.New("portal not found")
	ErrPortalSlugTaken = errors.New("portal slug already exists")
	ErrClientNotFound  = errors.New("client not found")
)
