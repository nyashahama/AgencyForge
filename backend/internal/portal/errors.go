package portal

import "errors"

var (
	ErrValidation     = errors.New("validation error")
	ErrPortalNotFound = errors.New("portal not found")
)
