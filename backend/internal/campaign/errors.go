package campaign

import "errors"

var (
	ErrValidation           = errors.New("validation error")
	ErrCampaignNotFound     = errors.New("campaign not found")
	ErrClientNotFound       = errors.New("client not found")
	ErrBriefNotFound        = errors.New("brief not found")
	ErrInvalidTransition    = errors.New("invalid campaign transition")
	ErrUnknownSpecialist    = errors.New("unknown specialist")
	ErrDuplicateAssignment  = errors.New("duplicate assignment specialist")
	ErrDuplicateDeliverable = errors.New("duplicate deliverable")
	ErrDuplicateApproval    = errors.New("duplicate approval")
)
