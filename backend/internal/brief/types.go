package brief

import "time"

type DocumentInput struct {
	StorageKey       string `json:"storage_key"`
	OriginalFilename string `json:"original_filename"`
	MediaType        string `json:"media_type"`
	ByteSize         int64  `json:"byte_size"`
	PageCount        int32  `json:"page_count"`
}

type CreateInput struct {
	ClientID   string          `json:"client_id"`
	Title      string          `json:"title"`
	Channel    string          `json:"channel"`
	Pages      int32           `json:"pages"`
	OwnerEmail string          `json:"owner_email"`
	SourceType string          `json:"source_type"`
	Documents  []DocumentInput `json:"documents"`
}

type LaunchInput struct {
	CampaignName string `json:"campaign_name"`
	BudgetCents  int64  `json:"budget_cents"`
	DueAt        string `json:"due_at"`
}

type Document struct {
	ID               string    `json:"id"`
	StorageKey       string    `json:"storage_key"`
	OriginalFilename string    `json:"original_filename"`
	MediaType        string    `json:"media_type"`
	ByteSize         int64     `json:"byte_size"`
	PageCount        int32     `json:"page_count"`
	CreatedAt        time.Time `json:"created_at"`
}

type StatusHistory struct {
	ID         string    `json:"id"`
	FromStatus *string   `json:"from_status,omitempty"`
	ToStatus   string    `json:"to_status"`
	Note       string    `json:"note"`
	CreatedAt  time.Time `json:"created_at"`
}

type Summary struct {
	ID            string     `json:"id"`
	ClientID      string     `json:"client_id"`
	ClientName    string     `json:"client_name"`
	Title         string     `json:"title"`
	Channel       string     `json:"channel"`
	Status        string     `json:"status"`
	Pages         int32      `json:"pages"`
	OwnerEmail    string     `json:"owner_email"`
	SourceType    string     `json:"source_type"`
	NextAction    string     `json:"next_action"`
	DocumentCount int64      `json:"document_count"`
	LaunchedAt    *time.Time `json:"launched_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Detail struct {
	Summary
	Documents []Document      `json:"documents"`
	History   []StatusHistory `json:"history"`
}

type LaunchResult struct {
	Brief      Detail `json:"brief"`
	CampaignID string `json:"campaign_id"`
}
