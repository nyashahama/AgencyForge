package brief

import "errors"

var (
	ErrValidation           = errors.New("validation error")
	ErrBriefNotFound        = errors.New("brief not found")
	ErrClientNotFound       = errors.New("client not found")
	ErrBriefAlreadyLaunched = errors.New("brief already launched")
)
