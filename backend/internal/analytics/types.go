package analytics

import "time"

type Overview struct {
	LiveCampaigns        int     `json:"live_campaigns"`
	ReviewsDue           int     `json:"reviews_due"`
	BriefsProcessed      int     `json:"briefs_processed"`
	ActiveClients        int     `json:"active_clients"`
	ActiveSpecialists    int     `json:"active_specialists"`
	PendingApprovals     int     `json:"pending_approvals"`
	WeeklyOutput         int     `json:"weekly_output"`
	AvgCompletionPercent int     `json:"avg_completion_percent"`
	ApprovalRate         float64 `json:"approval_rate"`
	ApprovalLatencyDays  float64 `json:"approval_latency_days"`
	AvgTurnaroundDays    float64 `json:"avg_turnaround_days"`
}

type ThroughputPoint struct {
	Day       time.Time `json:"day"`
	DayLabel  string    `json:"day_label"`
	Campaigns int       `json:"campaigns"`
}

type SpecialistLoad struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Code               string `json:"code"`
	SpecialtyType      string `json:"specialty_type"`
	Status             string `json:"status"`
	Color              string `json:"color"`
	Load               int    `json:"load"`
	OpenAssignments    int    `json:"open_assignments"`
	BlockedAssignments int    `json:"blocked_assignments"`
	ActiveCampaigns    int    `json:"active_campaigns"`
}

type ActivityItem struct {
	ID         string         `json:"id"`
	EventType  string         `json:"event_type"`
	Message    string         `json:"message"`
	Icon       string         `json:"icon"`
	TimeLabel  string         `json:"time_label"`
	Metadata   map[string]any `json:"metadata"`
	OccurredAt time.Time      `json:"occurred_at"`
}

type CampaignStatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type Dashboard struct {
	Overview         Overview              `json:"overview"`
	Throughput       []ThroughputPoint     `json:"throughput"`
	Specialists      []SpecialistLoad      `json:"specialists"`
	RecentActivity   []ActivityItem        `json:"recent_activity"`
	CampaignStatuses []CampaignStatusCount `json:"campaign_statuses"`
}
