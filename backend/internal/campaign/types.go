package campaign

import "time"

type AssignmentInput struct {
	SpecialistCode string `json:"specialist_code"`
	AssignedUserID string `json:"assigned_user_id"`
	Status         string `json:"status"`
	LoadUnits      int32  `json:"load_units"`
}

type DeliverableInput struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	DeliverableType string `json:"deliverable_type"`
	Status          string `json:"status"`
	FileURL         string `json:"file_url"`
}

type ApprovalInput struct {
	ID            string `json:"id"`
	ApproverName  string `json:"approver_name"`
	ApproverEmail string `json:"approver_email"`
	Status        string `json:"status"`
	Feedback      string `json:"feedback"`
}

type CreateInput struct {
	ClientID       string             `json:"client_id"`
	BriefID        string             `json:"brief_id"`
	Name           string             `json:"name"`
	Status         string             `json:"status"`
	BudgetCents    int64              `json:"budget_cents"`
	DueAt          string             `json:"due_at"`
	Progress       int32              `json:"progress"`
	RiskLevel      string             `json:"risk_level"`
	BudgetCurrency string             `json:"budget_currency"`
	Assignments    []AssignmentInput  `json:"assignments"`
	Deliverables   []DeliverableInput `json:"deliverables"`
	Approvals      []ApprovalInput    `json:"approvals"`
}

type UpdateInput struct {
	ClientID       *string             `json:"client_id"`
	BriefID        *string             `json:"brief_id"`
	Name           *string             `json:"name"`
	Status         *string             `json:"status"`
	BudgetCents    *int64              `json:"budget_cents"`
	DueAt          *string             `json:"due_at"`
	Progress       *int32              `json:"progress"`
	RiskLevel      *string             `json:"risk_level"`
	BudgetCurrency *string             `json:"budget_currency"`
	Assignments    *[]AssignmentInput  `json:"assignments"`
	Deliverables   *[]DeliverableInput `json:"deliverables"`
	Approvals      *[]ApprovalInput    `json:"approvals"`
}

type AdvanceInput struct {
	Note string `json:"note"`
}

type Summary struct {
	ID                    string     `json:"id"`
	ClientID              string     `json:"client_id"`
	ClientName            string     `json:"client_name"`
	BriefID               *string    `json:"brief_id,omitempty"`
	Name                  string     `json:"name"`
	Status                string     `json:"status"`
	Progress              int32      `json:"progress"`
	BudgetCents           int64      `json:"budget_cents"`
	BudgetCurrency        string     `json:"budget_currency"`
	RiskLevel             string     `json:"risk_level"`
	DeliverableCount      int32      `json:"deliverable_count"`
	PendingApprovalsCount int64      `json:"pending_approvals_count"`
	OwnerEmail            string     `json:"owner_email"`
	Specialists           []string   `json:"specialists"`
	DueAt                 *time.Time `json:"due_at,omitempty"`
	ApprovedAt            *time.Time `json:"approved_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

type Assignment struct {
	ID                string     `json:"id"`
	SpecialistID      string     `json:"specialist_id"`
	SpecialistCode    string     `json:"specialist_code"`
	SpecialistName    string     `json:"specialist_name"`
	AssignedUserID    *string    `json:"assigned_user_id,omitempty"`
	AssignedUserEmail string     `json:"assigned_user_email,omitempty"`
	Status            string     `json:"status"`
	LoadUnits         int32      `json:"load_units"`
	StartedAt         *time.Time `json:"started_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type Deliverable struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	DeliverableType string    `json:"deliverable_type"`
	Status          string    `json:"status"`
	FileURL         string    `json:"file_url"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Approval struct {
	ID            string     `json:"id"`
	ApproverName  string     `json:"approver_name"`
	ApproverEmail string     `json:"approver_email"`
	Status        string     `json:"status"`
	Feedback      string     `json:"feedback"`
	RequestedAt   time.Time  `json:"requested_at"`
	RespondedAt   *time.Time `json:"responded_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type StatusHistory struct {
	ID         string    `json:"id"`
	FromStatus *string   `json:"from_status,omitempty"`
	ToStatus   string    `json:"to_status"`
	Note       string    `json:"note"`
	CreatedAt  time.Time `json:"created_at"`
}

type Detail struct {
	Summary
	Assignments  []Assignment    `json:"assignments"`
	Deliverables []Deliverable   `json:"deliverables"`
	Approvals    []Approval      `json:"approvals"`
	History      []StatusHistory `json:"history"`
}
