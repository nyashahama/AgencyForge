package client

import "time"

type ContactInput struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type CreateInput struct {
	Name               string        `json:"name"`
	Slug               string        `json:"slug"`
	LeadEmail          string        `json:"lead_email"`
	Health             string        `json:"health"`
	Notes              string        `json:"notes"`
	MrrCents           int64         `json:"mrr_cents"`
	OpenApprovalsCount int32         `json:"open_approvals_count"`
	PrimaryContact     *ContactInput `json:"primary_contact"`
	InitialTouchpoint  string        `json:"initial_touchpoint"`
}

type UpdateInput struct {
	Name               *string       `json:"name"`
	Slug               *string       `json:"slug"`
	LeadEmail          *string       `json:"lead_email"`
	Health             *string       `json:"health"`
	Notes              *string       `json:"notes"`
	MrrCents           *int64        `json:"mrr_cents"`
	OpenApprovalsCount *int32        `json:"open_approvals_count"`
	PrimaryContact     *ContactInput `json:"primary_contact"`
	TouchpointNote     *string       `json:"touchpoint_note"`
}

type Contact struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsPrimary bool      `json:"is_primary"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Touchpoint struct {
	ID           string    `json:"id"`
	AuthorUserID *string   `json:"author_user_id,omitempty"`
	Note         string    `json:"note"`
	HappenedAt   time.Time `json:"happened_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type Summary struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	Slug               string     `json:"slug"`
	LeadEmail          string     `json:"lead_email"`
	Health             string     `json:"health"`
	Notes              string     `json:"notes"`
	MrrCents           int64      `json:"mrr_cents"`
	OpenApprovalsCount int32      `json:"open_approvals_count"`
	LastTouchpointAt   *time.Time `json:"last_touchpoint_at,omitempty"`
	PrimaryContact     *Contact   `json:"primary_contact,omitempty"`
	LatestTouchpoint   string     `json:"latest_touchpoint,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type Detail struct {
	Summary
	Contacts    []Contact    `json:"contacts"`
	Touchpoints []Touchpoint `json:"touchpoints"`
}
