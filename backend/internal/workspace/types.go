package workspace

import "time"

type CreatePlaybookInput struct {
	Name     string `json:"name"`
	Category string `json:"category"`
	Status   string `json:"status"`
	Body     string `json:"body"`
}

type UpdatePlaybookInput struct {
	Name     *string `json:"name"`
	Category *string `json:"category"`
	Status   *string `json:"status"`
	Body     *string `json:"body"`
}

type SettingItemUpdateInput struct {
	GroupKey string `json:"group_key"`
	ItemKey  string `json:"item_key"`
	Value    string `json:"value"`
}

type UpdateSettingsInput struct {
	Items []SettingItemUpdateInput `json:"items"`
}

type Playbook struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Category    string     `json:"category"`
	OwnerName   string     `json:"owner_name"`
	Status      string     `json:"status"`
	Body        string     `json:"body"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type SettingItem struct {
	ID        string    `json:"id"`
	Key       string    `json:"key"`
	Label     string    `json:"label"`
	Value     string    `json:"value"`
	SortOrder int32     `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SettingGroup struct {
	ID          string        `json:"id"`
	Key         string        `json:"key"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	SortOrder   int32         `json:"sort_order"`
	Items       []SettingItem `json:"items"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

type ActivityItem struct {
	ID          string         `json:"id"`
	EventType   string         `json:"event_type"`
	SubjectType string         `json:"subject_type"`
	Message     string         `json:"message"`
	Icon        string         `json:"icon"`
	Metadata    map[string]any `json:"metadata"`
	OccurredAt  time.Time      `json:"occurred_at"`
}
