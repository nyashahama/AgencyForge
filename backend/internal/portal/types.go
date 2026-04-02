package portal

import "time"

type ReviewFlowInput struct {
	Name       string         `json:"name"`
	ReviewMode string         `json:"review_mode"`
	Config     map[string]any `json:"config"`
}

type UpdateInput struct {
	Name              *string          `json:"name"`
	Theme             *string          `json:"theme"`
	ReviewMode        *string          `json:"review_mode"`
	Description       *string          `json:"description"`
	ShareState        *string          `json:"share_state"`
	DefaultReviewFlow *ReviewFlowInput `json:"default_review_flow"`
}

type PublishInput struct {
	ShareExpiresAt string         `json:"share_expires_at"`
	Payload        map[string]any `json:"payload"`
}

type Summary struct {
	ID                       string     `json:"id"`
	ClientID                 string     `json:"client_id"`
	ClientName               string     `json:"client_name"`
	Name                     string     `json:"name"`
	Slug                     string     `json:"slug"`
	Theme                    string     `json:"theme"`
	ReviewMode               string     `json:"review_mode"`
	ShareState               string     `json:"share_state"`
	Description              string     `json:"description"`
	LatestPublicationVersion int32      `json:"latest_publication_version"`
	ActiveShareCount         int64      `json:"active_share_count"`
	PublishedAt              *time.Time `json:"published_at,omitempty"`
	LastPublishedAt          *time.Time `json:"last_published_at,omitempty"`
	CreatedAt                time.Time  `json:"created_at"`
	UpdatedAt                time.Time  `json:"updated_at"`
}

type ReviewFlow struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	ReviewMode string         `json:"review_mode"`
	Config     map[string]any `json:"config"`
	IsDefault  bool           `json:"is_default"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

type Publication struct {
	ID                string         `json:"id"`
	VersionNumber     int32          `json:"version_number"`
	Status            string         `json:"status"`
	PublishedByUserID *string        `json:"published_by_user_id,omitempty"`
	Payload           map[string]any `json:"payload"`
	PublishedAt       *time.Time     `json:"published_at,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

type Share struct {
	ID             string     `json:"id"`
	AccessToken    string     `json:"access_token"`
	Status         string     `json:"status"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	LastAccessedAt *time.Time `json:"last_accessed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type Detail struct {
	Summary
	ReviewFlows  []ReviewFlow  `json:"review_flows"`
	Publications []Publication `json:"publications"`
	Shares       []Share       `json:"shares"`
}
