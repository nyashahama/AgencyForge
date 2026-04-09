package campaign

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/nyashahama/AgencyForge/backend/db/gen"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/activity"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authz"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	platformrequest "github.com/nyashahama/AgencyForge/backend/internal/platform/request"
)

type Service struct {
	db      *database.Pool
	queries *dbgen.Queries
}

type normalizedAssignmentInput struct {
	SpecialistCode string
	AssignedUserID pgtype.UUID
	Status         string
	LoadUnits      int32
}

type normalizedDeliverableInput struct {
	ID              uuid.UUID
	HasID           bool
	Name            string
	DeliverableType string
	Status          string
	FileURL         string
}

type normalizedApprovalInput struct {
	ID            uuid.UUID
	HasID         bool
	ApproverName  string
	ApproverEmail string
	Status        string
	Feedback      string
}

func NewService(db *database.Pool) *Service {
	var queries *dbgen.Queries
	if db != nil {
		queries = dbgen.New(db)
	}

	return &Service{
		db:      db,
		queries: queries,
	}
}

func (s *Service) List(ctx context.Context, principal authctx.Principal, pagination platformrequest.Pagination) ([]Summary, int, error) {
	if s.queries == nil {
		return nil, 0, errors.New("campaign service is not configured with a database")
	}

	total, err := s.queries.CountCampaignsByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, 0, fmt.Errorf("count campaigns: %w", err)
	}

	rows, err := s.queries.ListCampaignsByAgency(ctx, dbgen.ListCampaignsByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(pagination.PerPage),
		Offset:   int32(pagination.Offset()),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list campaigns: %w", err)
	}

	items := make([]Summary, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapCampaignSummaryRow(row))
	}

	return items, int(total), nil
}

func (s *Service) Get(ctx context.Context, principal authctx.Principal, campaignID uuid.UUID) (*Detail, error) {
	if s.queries == nil {
		return nil, errors.New("campaign service is not configured with a database")
	}

	if _, err := s.queries.GetCampaignByIDAndAgency(ctx, dbgen.GetCampaignByIDAndAgencyParams{
		AgencyID: principal.AgencyID,
		ID:       campaignID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCampaignNotFound
		}
		return nil, fmt.Errorf("get campaign: %w", err)
	}

	return loadDetailWithQueries(ctx, s.queries, principal.AgencyID, campaignID)
}

func (s *Service) Create(ctx context.Context, principal authctx.Principal, input CreateInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("campaign service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	clientID, err := parseRequiredUUID(input.ClientID, "client_id")
	if err != nil {
		return nil, err
	}

	briefID, briefProvided, err := parseOptionalUUID(input.BriefID, "brief_id")
	if err != nil {
		return nil, err
	}

	name, err := normalizeCampaignName(input.Name)
	if err != nil {
		return nil, err
	}

	status, err := normalizeCampaignStatus(input.Status, "draft")
	if err != nil {
		return nil, err
	}

	progress, err := normalizeProgress(input.Progress, defaultProgressForStatus(status))
	if err != nil {
		return nil, err
	}

	riskLevel, err := normalizeRiskLevel(input.RiskLevel, "medium")
	if err != nil {
		return nil, err
	}

	budgetCurrency, err := normalizeBudgetCurrency(input.BudgetCurrency)
	if err != nil {
		return nil, err
	}

	dueAt, err := parseOptionalTime(input.DueAt, "due_at")
	if err != nil {
		return nil, err
	}

	assignments, err := normalizeAssignmentInputs(input.Assignments)
	if err != nil {
		return nil, err
	}

	deliverables, err := normalizeDeliverableInputs(input.Deliverables)
	if err != nil {
		return nil, err
	}

	approvals, err := normalizeApprovalInputs(input.Approvals)
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)

		clientRecord, err := queries.GetClientByIDAndAgency(ctx, dbgen.GetClientByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       clientID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrClientNotFound
			}
			return nil, fmt.Errorf("get client: %w", err)
		}

		if briefProvided {
			briefRecord, err := queries.GetBriefByIDAndAgency(ctx, dbgen.GetBriefByIDAndAgencyParams{
				AgencyID: principal.AgencyID,
				ID:       briefID.Bytes,
			})
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return nil, ErrBriefNotFound
				}
				return nil, fmt.Errorf("get brief: %w", err)
			}
			if briefRecord.ClientID != clientRecord.ID {
				return nil, fmt.Errorf("%w: brief_id must belong to the same client", ErrValidation)
			}
		}

		approvedAt := approvedAtForStatus(status, pgtype.Timestamptz{})
		created, err := queries.CreateCampaign(ctx, dbgen.CreateCampaignParams{
			AgencyID:         principal.AgencyID,
			OwnerUserID:      nullableUUID(principal.UserID),
			ClientID:         clientRecord.ID,
			BriefID:          briefID,
			Name:             name,
			Status:           status,
			BudgetCents:      input.BudgetCents,
			DueAt:            dueAt,
			ProgressPercent:  progress,
			RiskLevel:        riskLevel,
			BudgetCurrency:   budgetCurrency,
			DeliverableCount: int32(len(deliverables)),
			ApprovedAt:       approvedAt,
		})
		if err != nil {
			return nil, fmt.Errorf("create campaign: %w", err)
		}

		if _, err := queries.CreateCampaignStatusHistory(ctx, dbgen.CreateCampaignStatusHistoryParams{
			CampaignID:      created.ID,
			FromStatus:      pgtype.Text{},
			ToStatus:        created.Status,
			ChangedByUserID: nullableUUID(principal.UserID),
			Note:            "Campaign created",
		}); err != nil {
			return nil, fmt.Errorf("create campaign history: %w", err)
		}

		if err := syncAssignments(ctx, queries, created.ID, assignments); err != nil {
			return nil, err
		}
		if err := syncDeliverables(ctx, queries, principal.AgencyID, created.ID, deliverables); err != nil {
			return nil, err
		}
		if err := syncApprovals(ctx, queries, principal.AgencyID, clientRecord.ID, created.ID, approvals); err != nil {
			return nil, err
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &clientRecord.ID,
			BriefID:     pgUUIDPtr(created.BriefID),
			CampaignID:  &created.ID,
			EventType:   "campaign.created",
			SubjectType: "campaign",
			SubjectID:   &created.ID,
			Message:     fmt.Sprintf("Created campaign %s", created.Name),
			Metadata: map[string]any{
				"status":            created.Status,
				"specialist_count":  len(assignments),
				"deliverable_count": len(deliverables),
				"approval_count":    len(approvals),
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, principal.AgencyID, created.ID)
	})
}

func (s *Service) Update(ctx context.Context, principal authctx.Principal, campaignID uuid.UUID, input UpdateInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("campaign service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)

		current, err := queries.GetCampaignByIDAndAgency(ctx, dbgen.GetCampaignByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       campaignID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrCampaignNotFound
			}
			return nil, fmt.Errorf("get campaign: %w", err)
		}

		clientID := current.ClientID
		if input.ClientID != nil {
			clientID, err = parseRequiredUUID(*input.ClientID, "client_id")
			if err != nil {
				return nil, err
			}
		}

		briefID := current.BriefID
		if input.BriefID != nil {
			briefID, _, err = parseOptionalUUID(*input.BriefID, "brief_id")
			if err != nil {
				return nil, err
			}
		}

		name := current.Name
		if input.Name != nil {
			name, err = normalizeCampaignName(*input.Name)
			if err != nil {
				return nil, err
			}
		}

		status := current.Status
		if input.Status != nil {
			status, err = normalizeCampaignStatus(*input.Status, current.Status)
			if err != nil {
				return nil, err
			}
		}

		progress := current.ProgressPercent
		if input.Progress != nil {
			progress, err = normalizeProgress(*input.Progress, current.ProgressPercent)
			if err != nil {
				return nil, err
			}
		}

		riskLevel := current.RiskLevel
		if input.RiskLevel != nil {
			riskLevel, err = normalizeRiskLevel(*input.RiskLevel, current.RiskLevel)
			if err != nil {
				return nil, err
			}
		}

		budgetCurrency := current.BudgetCurrency
		if input.BudgetCurrency != nil {
			budgetCurrency, err = normalizeBudgetCurrency(*input.BudgetCurrency)
			if err != nil {
				return nil, err
			}
		}

		budgetCents := current.BudgetCents
		if input.BudgetCents != nil {
			budgetCents = *input.BudgetCents
		}

		dueAt := current.DueAt
		if input.DueAt != nil {
			dueAt, err = parseOptionalTime(*input.DueAt, "due_at")
			if err != nil {
				return nil, err
			}
		}

		clientRecord, err := queries.GetClientByIDAndAgency(ctx, dbgen.GetClientByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       clientID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrClientNotFound
			}
			return nil, fmt.Errorf("get client: %w", err)
		}

		if briefID.Valid {
			briefRecord, err := queries.GetBriefByIDAndAgency(ctx, dbgen.GetBriefByIDAndAgencyParams{
				AgencyID: principal.AgencyID,
				ID:       briefID.Bytes,
			})
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return nil, ErrBriefNotFound
				}
				return nil, fmt.Errorf("get brief: %w", err)
			}
			if briefRecord.ClientID != clientRecord.ID {
				return nil, fmt.Errorf("%w: brief_id must belong to the same client", ErrValidation)
			}
		}

		assignmentsChanged := input.Assignments != nil
		deliverablesChanged := input.Deliverables != nil
		approvalsChanged := input.Approvals != nil

		var assignments []normalizedAssignmentInput
		if input.Assignments != nil {
			assignments, err = normalizeAssignmentInputs(*input.Assignments)
			if err != nil {
				return nil, err
			}
		}

		var deliverables []normalizedDeliverableInput
		if input.Deliverables != nil {
			deliverables, err = normalizeDeliverableInputs(*input.Deliverables)
			if err != nil {
				return nil, err
			}
		}

		var approvals []normalizedApprovalInput
		if input.Approvals != nil {
			approvals, err = normalizeApprovalInputs(*input.Approvals)
			if err != nil {
				return nil, err
			}
		}

		deliverableCount := current.DeliverableCount
		if deliverablesChanged {
			deliverableCount = int32(len(deliverables))
		}

		approvedAt := approvedAtForStatus(status, current.ApprovedAt)
		updated, err := queries.UpdateCampaign(ctx, dbgen.UpdateCampaignParams{
			AgencyID:         principal.AgencyID,
			ID:               current.ID,
			ClientID:         clientRecord.ID,
			BriefID:          briefID,
			OwnerUserID:      current.OwnerUserID,
			Name:             name,
			Status:           status,
			BudgetCents:      budgetCents,
			DueAt:            dueAt,
			ProgressPercent:  progress,
			RiskLevel:        riskLevel,
			BudgetCurrency:   budgetCurrency,
			DeliverableCount: deliverableCount,
			ApprovedAt:       approvedAt,
		})
		if err != nil {
			return nil, fmt.Errorf("update campaign: %w", err)
		}

		if assignmentsChanged {
			if err := syncAssignments(ctx, queries, updated.ID, assignments); err != nil {
				return nil, err
			}
		}
		if deliverablesChanged {
			if err := syncDeliverables(ctx, queries, principal.AgencyID, updated.ID, deliverables); err != nil {
				return nil, err
			}
		}
		if approvalsChanged {
			if err := syncApprovals(ctx, queries, principal.AgencyID, clientRecord.ID, updated.ID, approvals); err != nil {
				return nil, err
			}
		}

		if current.Status != updated.Status {
			if _, err := queries.CreateCampaignStatusHistory(ctx, dbgen.CreateCampaignStatusHistoryParams{
				CampaignID:      updated.ID,
				FromStatus:      pgtype.Text{String: current.Status, Valid: true},
				ToStatus:        updated.Status,
				ChangedByUserID: nullableUUID(principal.UserID),
				Note:            "Campaign status updated",
			}); err != nil {
				return nil, fmt.Errorf("create campaign history: %w", err)
			}
		}

		if current.ClientID != updated.ClientID {
			if err := queries.SetClientOpenApprovalsCountFromCampaigns(ctx, dbgen.SetClientOpenApprovalsCountFromCampaignsParams{
				AgencyID: principal.AgencyID,
				ID:       current.ClientID,
			}); err != nil {
				return nil, fmt.Errorf("refresh previous client approvals: %w", err)
			}
		}
		if approvalsChanged || current.ClientID != updated.ClientID {
			if err := queries.SetClientOpenApprovalsCountFromCampaigns(ctx, dbgen.SetClientOpenApprovalsCountFromCampaignsParams{
				AgencyID: principal.AgencyID,
				ID:       updated.ClientID,
			}); err != nil {
				return nil, fmt.Errorf("refresh client approvals: %w", err)
			}
		}

		changedFields := campaignChangedFields(current, updated, assignmentsChanged, deliverablesChanged, approvalsChanged)
		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &updated.ClientID,
			BriefID:     pgUUIDPtr(updated.BriefID),
			CampaignID:  &updated.ID,
			EventType:   "campaign.updated",
			SubjectType: "campaign",
			SubjectID:   &updated.ID,
			Message:     fmt.Sprintf("Updated campaign %s", updated.Name),
			Metadata: map[string]any{
				"changed_fields": changedFields,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, principal.AgencyID, updated.ID)
	})
}

func (s *Service) Advance(ctx context.Context, principal authctx.Principal, campaignID uuid.UUID, input AdvanceInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("campaign service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	note := strings.TrimSpace(input.Note)

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)

		current, err := queries.GetCampaignByIDAndAgency(ctx, dbgen.GetCampaignByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       campaignID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrCampaignNotFound
			}
			return nil, fmt.Errorf("get campaign: %w", err)
		}

		nextStatus, err := nextCampaignStatus(current.Status)
		if err != nil {
			return nil, err
		}

		progress := nextProgressForAdvance(current.Status, current.ProgressPercent)
		approvedAt := approvedAtForStatus(nextStatus, current.ApprovedAt)

		updated, err := queries.UpdateCampaignWorkflowState(ctx, dbgen.UpdateCampaignWorkflowStateParams{
			AgencyID:        principal.AgencyID,
			ID:              current.ID,
			Status:          nextStatus,
			ProgressPercent: progress,
			ApprovedAt:      approvedAt,
		})
		if err != nil {
			return nil, fmt.Errorf("advance campaign: %w", err)
		}

		if note == "" {
			note = fmt.Sprintf("Campaign advanced to %s", nextStatus)
		}

		if _, err := queries.CreateCampaignStatusHistory(ctx, dbgen.CreateCampaignStatusHistoryParams{
			CampaignID:      updated.ID,
			FromStatus:      pgtype.Text{String: current.Status, Valid: true},
			ToStatus:        updated.Status,
			ChangedByUserID: nullableUUID(principal.UserID),
			Note:            note,
		}); err != nil {
			return nil, fmt.Errorf("create campaign history: %w", err)
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &updated.ClientID,
			BriefID:     pgUUIDPtr(updated.BriefID),
			CampaignID:  &updated.ID,
			EventType:   "campaign.advanced",
			SubjectType: "campaign",
			SubjectID:   &updated.ID,
			Message:     fmt.Sprintf("Advanced campaign %s to %s", updated.Name, updated.Status),
			Metadata: map[string]any{
				"from_status": current.Status,
				"to_status":   updated.Status,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, principal.AgencyID, updated.ID)
	})
}

func loadDetailWithQueries(ctx context.Context, queries *dbgen.Queries, agencyID uuid.UUID, campaignID uuid.UUID) (*Detail, error) {
	record, err := queries.GetCampaignSummaryByIDAndAgency(ctx, dbgen.GetCampaignSummaryByIDAndAgencyParams{
		AgencyID: agencyID,
		ID:       campaignID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrCampaignNotFound
		}
		return nil, fmt.Errorf("get campaign summary: %w", err)
	}

	assignments, err := queries.ListCampaignAssignmentsByCampaign(ctx, campaignID)
	if err != nil {
		return nil, fmt.Errorf("list campaign assignments: %w", err)
	}

	deliverables, err := queries.ListCampaignDeliverablesByCampaign(ctx, campaignID)
	if err != nil {
		return nil, fmt.Errorf("list campaign deliverables: %w", err)
	}

	approvals, err := queries.ListCampaignApprovalsByCampaign(ctx, campaignID)
	if err != nil {
		return nil, fmt.Errorf("list campaign approvals: %w", err)
	}

	history, err := queries.ListCampaignStatusHistoryByCampaign(ctx, campaignID)
	if err != nil {
		return nil, fmt.Errorf("list campaign history: %w", err)
	}

	detail := &Detail{
		Summary:      mapCampaignSummaryDetailRow(record),
		Assignments:  make([]Assignment, 0, len(assignments)),
		Deliverables: make([]Deliverable, 0, len(deliverables)),
		Approvals:    make([]Approval, 0, len(approvals)),
		History:      make([]StatusHistory, 0, len(history)),
	}

	for _, assignment := range assignments {
		detail.Assignments = append(detail.Assignments, mapAssignment(assignment))
	}
	for _, deliverable := range deliverables {
		detail.Deliverables = append(detail.Deliverables, mapDeliverable(deliverable))
	}
	for _, approval := range approvals {
		detail.Approvals = append(detail.Approvals, mapApproval(approval))
	}
	for _, item := range history {
		detail.History = append(detail.History, mapStatusHistory(item))
	}

	return detail, nil
}

func syncAssignments(ctx context.Context, queries *dbgen.Queries, campaignID uuid.UUID, inputs []normalizedAssignmentInput) error {
	existing, err := queries.ListCampaignAssignmentsByCampaign(ctx, campaignID)
	if err != nil {
		return fmt.Errorf("list existing campaign assignments: %w", err)
	}

	existingByCode := make(map[string]dbgen.ListCampaignAssignmentsByCampaignRow, len(existing))
	for _, row := range existing {
		existingByCode[row.SpecialistCode] = row
	}

	codes := make([]string, 0, len(inputs))
	for _, input := range inputs {
		codes = append(codes, input.SpecialistCode)
	}

	specialistsByCode, err := loadSpecialistsByCode(ctx, queries, codes)
	if err != nil {
		return err
	}

	seen := make(map[string]struct{}, len(inputs))
	now := time.Now().UTC()
	for _, input := range inputs {
		specialist, ok := specialistsByCode[input.SpecialistCode]
		if !ok {
			return fmt.Errorf("%w: specialist_code %q", ErrUnknownSpecialist, input.SpecialistCode)
		}

		if current, ok := existingByCode[input.SpecialistCode]; ok {
			startedAt, completedAt := assignmentTimestamps(input.Status, current.StartedAt, current.CompletedAt, now)
			if _, err := queries.UpdateCampaignAssignment(ctx, dbgen.UpdateCampaignAssignmentParams{
				ID:             current.ID,
				CampaignID:     campaignID,
				AssignedUserID: input.AssignedUserID,
				Status:         input.Status,
				LoadUnits:      input.LoadUnits,
				StartedAt:      startedAt,
				CompletedAt:    completedAt,
			}); err != nil {
				return fmt.Errorf("update campaign assignment: %w", err)
			}
		} else {
			startedAt, completedAt := assignmentTimestamps(input.Status, pgtype.Timestamptz{}, pgtype.Timestamptz{}, now)
			if _, err := queries.CreateCampaignAssignment(ctx, dbgen.CreateCampaignAssignmentParams{
				CampaignID:     campaignID,
				SpecialistID:   specialist.ID,
				AssignedUserID: input.AssignedUserID,
				Status:         input.Status,
				LoadUnits:      input.LoadUnits,
				StartedAt:      startedAt,
				CompletedAt:    completedAt,
			}); err != nil {
				return fmt.Errorf("create campaign assignment: %w", err)
			}
		}

		seen[input.SpecialistCode] = struct{}{}
	}

	for _, row := range existing {
		if _, ok := seen[row.SpecialistCode]; ok {
			continue
		}
		if err := queries.DeleteCampaignAssignment(ctx, dbgen.DeleteCampaignAssignmentParams{
			ID:         row.ID,
			CampaignID: campaignID,
		}); err != nil {
			return fmt.Errorf("delete campaign assignment: %w", err)
		}
	}

	return nil
}

func syncDeliverables(ctx context.Context, queries *dbgen.Queries, agencyID uuid.UUID, campaignID uuid.UUID, inputs []normalizedDeliverableInput) error {
	existing, err := queries.ListCampaignDeliverablesByCampaign(ctx, campaignID)
	if err != nil {
		return fmt.Errorf("list campaign deliverables: %w", err)
	}

	existingByID := make(map[uuid.UUID]dbgen.CampaignDeliverable, len(existing))
	for _, row := range existing {
		existingByID[row.ID] = row
	}

	seen := make(map[uuid.UUID]struct{}, len(inputs))
	for _, input := range inputs {
		if input.HasID {
			current, ok := existingByID[input.ID]
			if !ok {
				return fmt.Errorf("%w: deliverable id %s", ErrValidation, input.ID.String())
			}
			if _, err := queries.UpdateCampaignDeliverable(ctx, dbgen.UpdateCampaignDeliverableParams{
				ID:              current.ID,
				CampaignID:      campaignID,
				Name:            input.Name,
				DeliverableType: input.DeliverableType,
				Status:          input.Status,
				FileUrl:         input.FileURL,
			}); err != nil {
				return fmt.Errorf("update campaign deliverable: %w", err)
			}
			seen[current.ID] = struct{}{}
			continue
		}

		created, err := queries.CreateCampaignDeliverable(ctx, dbgen.CreateCampaignDeliverableParams{
			CampaignID:      campaignID,
			Name:            input.Name,
			DeliverableType: input.DeliverableType,
			Status:          input.Status,
			FileUrl:         input.FileURL,
		})
		if err != nil {
			return fmt.Errorf("create campaign deliverable: %w", err)
		}
		seen[created.ID] = struct{}{}
	}

	for _, row := range existing {
		if _, ok := seen[row.ID]; ok {
			continue
		}
		if err := queries.DeleteCampaignDeliverable(ctx, dbgen.DeleteCampaignDeliverableParams{
			ID:         row.ID,
			CampaignID: campaignID,
		}); err != nil {
			return fmt.Errorf("delete campaign deliverable: %w", err)
		}
	}

	if err := queries.SetCampaignDeliverableCount(ctx, dbgen.SetCampaignDeliverableCountParams{
		AgencyID:   agencyID,
		CampaignID: campaignID,
	}); err != nil {
		return fmt.Errorf("refresh campaign deliverable count: %w", err)
	}

	return nil
}

func syncApprovals(ctx context.Context, queries *dbgen.Queries, agencyID uuid.UUID, clientID uuid.UUID, campaignID uuid.UUID, inputs []normalizedApprovalInput) error {
	existing, err := queries.ListCampaignApprovalsByCampaign(ctx, campaignID)
	if err != nil {
		return fmt.Errorf("list campaign approvals: %w", err)
	}

	existingByID := make(map[uuid.UUID]dbgen.CampaignApproval, len(existing))
	for _, row := range existing {
		existingByID[row.ID] = row
	}

	seen := make(map[uuid.UUID]struct{}, len(inputs))
	now := time.Now().UTC()
	for _, input := range inputs {
		if input.HasID {
			current, ok := existingByID[input.ID]
			if !ok {
				return fmt.Errorf("%w: approval id %s", ErrValidation, input.ID.String())
			}
			respondedAt := approvalRespondedAt(input.Status, current.RespondedAt, now)
			if _, err := queries.UpdateCampaignApproval(ctx, dbgen.UpdateCampaignApprovalParams{
				ID:            current.ID,
				CampaignID:    campaignID,
				ApproverName:  input.ApproverName,
				ApproverEmail: input.ApproverEmail,
				Status:        input.Status,
				Feedback:      input.Feedback,
				RespondedAt:   respondedAt,
			}); err != nil {
				return fmt.Errorf("update campaign approval: %w", err)
			}
			seen[current.ID] = struct{}{}
			continue
		}

		respondedAt := approvalRespondedAt(input.Status, pgtype.Timestamptz{}, now)
		created, err := queries.CreateCampaignApproval(ctx, dbgen.CreateCampaignApprovalParams{
			CampaignID:    campaignID,
			ApproverName:  input.ApproverName,
			ApproverEmail: input.ApproverEmail,
			Status:        input.Status,
			Feedback:      input.Feedback,
			RespondedAt:   respondedAt,
		})
		if err != nil {
			return fmt.Errorf("create campaign approval: %w", err)
		}
		seen[created.ID] = struct{}{}
	}

	for _, row := range existing {
		if _, ok := seen[row.ID]; ok {
			continue
		}
		if err := queries.DeleteCampaignApproval(ctx, dbgen.DeleteCampaignApprovalParams{
			ID:         row.ID,
			CampaignID: campaignID,
		}); err != nil {
			return fmt.Errorf("delete campaign approval: %w", err)
		}
	}

	if err := queries.SetClientOpenApprovalsCountFromCampaigns(ctx, dbgen.SetClientOpenApprovalsCountFromCampaignsParams{
		AgencyID: agencyID,
		ID:       clientID,
	}); err != nil {
		return fmt.Errorf("refresh client approval count: %w", err)
	}

	return nil
}

func loadSpecialistsByCode(ctx context.Context, queries *dbgen.Queries, codes []string) (map[string]dbgen.Specialist, error) {
	if len(codes) == 0 {
		return map[string]dbgen.Specialist{}, nil
	}

	rows, err := queries.GetSpecialistsByCodes(ctx, codes)
	if err != nil {
		return nil, fmt.Errorf("list specialists: %w", err)
	}

	specialists := make(map[string]dbgen.Specialist, len(rows))
	for _, row := range rows {
		specialists[row.Code] = row
	}

	return specialists, nil
}

func parseRequiredUUID(raw string, field string) (uuid.UUID, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return uuid.UUID{}, fmt.Errorf("%w: %s is required", ErrValidation, field)
	}

	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("%w: %s must be a valid UUID", ErrValidation, field)
	}

	return id, nil
}

func parseOptionalUUID(raw string, field string) (pgtype.UUID, bool, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return pgtype.UUID{}, false, nil
	}

	id, err := uuid.Parse(value)
	if err != nil {
		return pgtype.UUID{}, false, fmt.Errorf("%w: %s must be a valid UUID", ErrValidation, field)
	}

	return nullableUUID(id), true, nil
}

func parseOptionalTime(raw string, field string) (pgtype.Timestamptz, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return pgtype.Timestamptz{}, nil
	}

	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return pgtype.Timestamptz{}, fmt.Errorf("%w: %s must be RFC3339", ErrValidation, field)
	}

	return pgtype.Timestamptz{Time: parsed.UTC(), Valid: true}, nil
}

func normalizeCampaignName(raw string) (string, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return "", fmt.Errorf("%w: name is required", ErrValidation)
	}
	return value, nil
}

func normalizeCampaignStatus(raw string, fallback string) (string, error) {
	value := strings.TrimSpace(strings.ToLower(raw))
	if value == "" {
		value = fallback
	}

	switch value {
	case "draft", "generating", "review", "approved", "paused", "cancelled":
		return value, nil
	default:
		return "", fmt.Errorf("%w: status must be one of draft, generating, review, approved, paused, cancelled", ErrValidation)
	}
}

func normalizeProgress(raw int32, fallback int32) (int32, error) {
	value := raw
	if value == 0 && fallback != 0 {
		value = fallback
	}
	if value < 0 || value > 100 {
		return 0, fmt.Errorf("%w: progress must be between 0 and 100", ErrValidation)
	}
	return value, nil
}

func normalizeRiskLevel(raw string, fallback string) (string, error) {
	value := strings.TrimSpace(strings.ToLower(raw))
	if value == "" {
		value = fallback
	}

	switch value {
	case "low", "medium", "high":
		return value, nil
	default:
		return "", fmt.Errorf("%w: risk_level must be one of low, medium, high", ErrValidation)
	}
}

func normalizeBudgetCurrency(raw string) (string, error) {
	value := strings.ToUpper(strings.TrimSpace(raw))
	if value == "" {
		value = "USD"
	}
	if len(value) != 3 {
		return "", fmt.Errorf("%w: budget_currency must be a 3-letter code", ErrValidation)
	}
	return value, nil
}

func normalizeAssignmentInputs(inputs []AssignmentInput) ([]normalizedAssignmentInput, error) {
	normalized := make([]normalizedAssignmentInput, 0, len(inputs))
	seen := make(map[string]struct{}, len(inputs))

	for _, input := range inputs {
		code := strings.TrimSpace(strings.ToLower(input.SpecialistCode))
		if code == "" {
			return nil, fmt.Errorf("%w: assignment specialist_code is required", ErrValidation)
		}
		if _, ok := seen[code]; ok {
			return nil, fmt.Errorf("%w: %s", ErrDuplicateAssignment, code)
		}

		status := strings.TrimSpace(strings.ToLower(input.Status))
		if status == "" {
			status = "queued"
		}
		switch status {
		case "queued", "active", "blocked", "complete":
		default:
			return nil, fmt.Errorf("%w: assignment status must be one of queued, active, blocked, complete", ErrValidation)
		}

		loadUnits := input.LoadUnits
		if loadUnits <= 0 {
			loadUnits = 1
		}

		assignedUserID, _, err := parseOptionalUUID(input.AssignedUserID, "assigned_user_id")
		if err != nil {
			return nil, err
		}

		normalized = append(normalized, normalizedAssignmentInput{
			SpecialistCode: code,
			AssignedUserID: assignedUserID,
			Status:         status,
			LoadUnits:      loadUnits,
		})
		seen[code] = struct{}{}
	}

	return normalized, nil
}

func normalizeDeliverableInputs(inputs []DeliverableInput) ([]normalizedDeliverableInput, error) {
	normalized := make([]normalizedDeliverableInput, 0, len(inputs))
	seenIDs := make(map[uuid.UUID]struct{}, len(inputs))

	for _, input := range inputs {
		name := strings.TrimSpace(input.Name)
		if name == "" {
			return nil, fmt.Errorf("%w: deliverable name is required", ErrValidation)
		}

		deliverableType := strings.TrimSpace(strings.ToLower(input.DeliverableType))
		if deliverableType == "" {
			deliverableType = "asset"
		}

		status := strings.TrimSpace(strings.ToLower(input.Status))
		if status == "" {
			status = "draft"
		}
		switch status {
		case "draft", "generating", "review", "approved", "delivered":
		default:
			return nil, fmt.Errorf("%w: deliverable status must be one of draft, generating, review, approved, delivered", ErrValidation)
		}

		item := normalizedDeliverableInput{
			Name:            name,
			DeliverableType: deliverableType,
			Status:          status,
			FileURL:         strings.TrimSpace(input.FileURL),
		}

		if strings.TrimSpace(input.ID) != "" {
			id, err := uuid.Parse(strings.TrimSpace(input.ID))
			if err != nil {
				return nil, fmt.Errorf("%w: deliverable id must be a valid UUID", ErrValidation)
			}
			if _, ok := seenIDs[id]; ok {
				return nil, fmt.Errorf("%w: %s", ErrDuplicateDeliverable, id.String())
			}
			item.ID = id
			item.HasID = true
			seenIDs[id] = struct{}{}
		}

		normalized = append(normalized, item)
	}

	return normalized, nil
}

func normalizeApprovalInputs(inputs []ApprovalInput) ([]normalizedApprovalInput, error) {
	normalized := make([]normalizedApprovalInput, 0, len(inputs))
	seenIDs := make(map[uuid.UUID]struct{}, len(inputs))

	for _, input := range inputs {
		name := strings.TrimSpace(input.ApproverName)
		email := strings.ToLower(strings.TrimSpace(input.ApproverEmail))
		if name == "" || email == "" {
			return nil, fmt.Errorf("%w: approval approver_name and approver_email are required", ErrValidation)
		}

		status := strings.TrimSpace(strings.ToLower(input.Status))
		if status == "" {
			status = "pending"
		}
		switch status {
		case "pending", "approved", "changes_requested", "rejected":
		default:
			return nil, fmt.Errorf("%w: approval status must be one of pending, approved, changes_requested, rejected", ErrValidation)
		}

		item := normalizedApprovalInput{
			ApproverName:  name,
			ApproverEmail: email,
			Status:        status,
			Feedback:      strings.TrimSpace(input.Feedback),
		}

		if strings.TrimSpace(input.ID) != "" {
			id, err := uuid.Parse(strings.TrimSpace(input.ID))
			if err != nil {
				return nil, fmt.Errorf("%w: approval id must be a valid UUID", ErrValidation)
			}
			if _, ok := seenIDs[id]; ok {
				return nil, fmt.Errorf("%w: %s", ErrDuplicateApproval, id.String())
			}
			item.ID = id
			item.HasID = true
			seenIDs[id] = struct{}{}
		}

		normalized = append(normalized, item)
	}

	return normalized, nil
}

func nextCampaignStatus(current string) (string, error) {
	switch current {
	case "draft":
		return "generating", nil
	case "generating":
		return "review", nil
	case "review":
		return "approved", nil
	default:
		return "", fmt.Errorf("%w: %s campaigns cannot be advanced", ErrInvalidTransition, current)
	}
}

func defaultProgressForStatus(status string) int32 {
	switch status {
	case "generating":
		return 25
	case "review":
		return 85
	case "approved":
		return 100
	default:
		return 0
	}
}

func nextProgressForAdvance(current string, existing int32) int32 {
	switch current {
	case "draft":
		return max(existing, 25)
	case "generating":
		return max(existing, 85)
	case "review":
		return 100
	default:
		return existing
	}
}

func approvedAtForStatus(status string, current pgtype.Timestamptz) pgtype.Timestamptz {
	if status == "approved" {
		if current.Valid {
			return current
		}
		return pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	}
	return pgtype.Timestamptz{}
}

func approvalRespondedAt(status string, current pgtype.Timestamptz, now time.Time) pgtype.Timestamptz {
	if status == "pending" {
		return pgtype.Timestamptz{}
	}
	if current.Valid {
		return current
	}
	return pgtype.Timestamptz{Time: now, Valid: true}
}

func assignmentTimestamps(status string, currentStarted pgtype.Timestamptz, currentCompleted pgtype.Timestamptz, now time.Time) (pgtype.Timestamptz, pgtype.Timestamptz) {
	startedAt := currentStarted
	completedAt := currentCompleted

	switch status {
	case "queued":
		return pgtype.Timestamptz{}, pgtype.Timestamptz{}
	case "active", "blocked":
		if !startedAt.Valid {
			startedAt = pgtype.Timestamptz{Time: now, Valid: true}
		}
		return startedAt, pgtype.Timestamptz{}
	case "complete":
		if !startedAt.Valid {
			startedAt = pgtype.Timestamptz{Time: now, Valid: true}
		}
		if !completedAt.Valid {
			completedAt = pgtype.Timestamptz{Time: now, Valid: true}
		}
		return startedAt, completedAt
	default:
		return startedAt, completedAt
	}
}

func campaignChangedFields(current dbgen.Campaign, updated dbgen.Campaign, assignmentsChanged bool, deliverablesChanged bool, approvalsChanged bool) []string {
	fields := make([]string, 0, 8)

	if current.ClientID != updated.ClientID {
		fields = append(fields, "client_id")
	}
	if current.BriefID != updated.BriefID {
		fields = append(fields, "brief_id")
	}
	if current.Name != updated.Name {
		fields = append(fields, "name")
	}
	if current.Status != updated.Status {
		fields = append(fields, "status")
	}
	if current.BudgetCents != updated.BudgetCents {
		fields = append(fields, "budget_cents")
	}
	if current.ProgressPercent != updated.ProgressPercent {
		fields = append(fields, "progress")
	}
	if current.RiskLevel != updated.RiskLevel {
		fields = append(fields, "risk_level")
	}
	if current.BudgetCurrency != updated.BudgetCurrency {
		fields = append(fields, "budget_currency")
	}
	if assignmentsChanged {
		fields = append(fields, "assignments")
	}
	if deliverablesChanged {
		fields = append(fields, "deliverables")
	}
	if approvalsChanged {
		fields = append(fields, "approvals")
	}

	return fields
}

func nullableUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: true,
	}
}

func pgUUIDPtr(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	id := uuid.UUID(value.Bytes)
	return &id
}

func timePtr(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	timestamp := value.Time
	return &timestamp
}

func stringPtr(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	text := value.String
	return &text
}

func mapCampaignSummaryRow(row dbgen.ListCampaignsByAgencyRow) Summary {
	summary := Summary{
		ID:                    row.ID.String(),
		ClientID:              row.ClientID.String(),
		ClientName:            row.ClientName,
		Name:                  row.Name,
		Status:                row.Status,
		Progress:              row.ProgressPercent,
		BudgetCents:           row.BudgetCents,
		BudgetCurrency:        row.BudgetCurrency,
		RiskLevel:             row.RiskLevel,
		DeliverableCount:      row.DeliverableCount,
		PendingApprovalsCount: row.PendingApprovalsCount,
		OwnerEmail:            row.OwnerEmail,
		Specialists:           stringSlice(row.SpecialistNames),
		CreatedAt:             row.CreatedAt,
		UpdatedAt:             row.UpdatedAt,
	}
	if row.BriefID.Valid {
		briefID := uuid.UUID(row.BriefID.Bytes).String()
		summary.BriefID = &briefID
	}
	summary.DueAt = timePtr(row.DueAt)
	summary.ApprovedAt = timePtr(row.ApprovedAt)
	return summary
}

func mapCampaignSummaryDetailRow(row dbgen.GetCampaignSummaryByIDAndAgencyRow) Summary {
	summary := Summary{
		ID:                    row.ID.String(),
		ClientID:              row.ClientID.String(),
		ClientName:            row.ClientName,
		Name:                  row.Name,
		Status:                row.Status,
		Progress:              row.ProgressPercent,
		BudgetCents:           row.BudgetCents,
		BudgetCurrency:        row.BudgetCurrency,
		RiskLevel:             row.RiskLevel,
		DeliverableCount:      row.DeliverableCount,
		PendingApprovalsCount: row.PendingApprovalsCount,
		OwnerEmail:            row.OwnerEmail,
		Specialists:           stringSlice(row.SpecialistNames),
		CreatedAt:             row.CreatedAt,
		UpdatedAt:             row.UpdatedAt,
	}
	if row.BriefID.Valid {
		briefID := uuid.UUID(row.BriefID.Bytes).String()
		summary.BriefID = &briefID
	}
	summary.DueAt = timePtr(row.DueAt)
	summary.ApprovedAt = timePtr(row.ApprovedAt)
	return summary
}

func mapAssignment(row dbgen.ListCampaignAssignmentsByCampaignRow) Assignment {
	assignment := Assignment{
		ID:                row.ID.String(),
		SpecialistID:      row.SpecialistID.String(),
		SpecialistCode:    row.SpecialistCode,
		SpecialistName:    row.SpecialistName,
		AssignedUserEmail: row.AssignedUserEmail,
		Status:            row.Status,
		LoadUnits:         row.LoadUnits,
		CreatedAt:         row.CreatedAt,
		UpdatedAt:         row.UpdatedAt,
	}
	if row.AssignedUserID.Valid {
		id := uuid.UUID(row.AssignedUserID.Bytes).String()
		assignment.AssignedUserID = &id
	}
	assignment.StartedAt = timePtr(row.StartedAt)
	assignment.CompletedAt = timePtr(row.CompletedAt)
	return assignment
}

func mapDeliverable(row dbgen.CampaignDeliverable) Deliverable {
	return Deliverable{
		ID:              row.ID.String(),
		Name:            row.Name,
		DeliverableType: row.DeliverableType,
		Status:          row.Status,
		FileURL:         row.FileUrl,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}

func mapApproval(row dbgen.CampaignApproval) Approval {
	return Approval{
		ID:            row.ID.String(),
		ApproverName:  row.ApproverName,
		ApproverEmail: row.ApproverEmail,
		Status:        row.Status,
		Feedback:      row.Feedback,
		RequestedAt:   row.RequestedAt,
		RespondedAt:   timePtr(row.RespondedAt),
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}
}

func mapStatusHistory(row dbgen.CampaignStatusHistory) StatusHistory {
	return StatusHistory{
		ID:         row.ID.String(),
		FromStatus: stringPtr(row.FromStatus),
		ToStatus:   row.ToStatus,
		Note:       row.Note,
		CreatedAt:  row.CreatedAt,
	}
}

func stringSlice(value any) []string {
	switch items := value.(type) {
	case nil:
		return []string{}
	case []string:
		return append([]string(nil), items...)
	case []any:
		out := make([]string, 0, len(items))
		for _, item := range items {
			text, ok := item.(string)
			if ok {
				out = append(out, text)
			}
		}
		return out
	default:
		return []string{}
	}
}
