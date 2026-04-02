package workspace

import "errors"

var (
	ErrValidation       = errors.New("validation error")
	ErrPlaybookNotFound = errors.New("playbook not found")
	ErrPlaybookNameUsed = errors.New("playbook name already exists")
)
