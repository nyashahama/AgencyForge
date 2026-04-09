package brief

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
		return nil, 0, errors.New("brief service is not configured with a database")
	}

	total, err := s.queries.CountBriefsByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, 0, fmt.Errorf("count briefs: %w", err)
	}

	rows, err := s.queries.ListBriefsByAgency(ctx, dbgen.ListBriefsByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(pagination.PerPage),
		Offset:   int32(pagination.Offset()),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list briefs: %w", err)
	}

	items := make([]Summary, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapSummary(row))
	}

	return items, int(total), nil
}

func (s *Service) Get(ctx context.Context, principal authctx.Principal, briefID uuid.UUID) (*Detail, error) {
	if s.queries == nil {
		return nil, errors.New("brief service is not configured with a database")
	}

	record, err := s.queries.GetBriefByIDAndAgency(ctx, dbgen.GetBriefByIDAndAgencyParams{
		AgencyID: principal.AgencyID,
		ID:       briefID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrBriefNotFound
		}
		return nil, fmt.Errorf("get brief: %w", err)
	}

	return s.loadDetail(ctx, record)
}

func (s *Service) Create(ctx context.Context, principal authctx.Principal, input CreateInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("brief service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	normalized, err := normalizeCreateInput(input, principal.Email)
	if err != nil {
		return nil, err
	}

	clientID, err := uuid.Parse(normalized.ClientID)
	if err != nil {
		return nil, fmt.Errorf("%w: client_id must be a valid UUID", ErrValidation)
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

		created, err := queries.CreateBrief(ctx, dbgen.CreateBriefParams{
			AgencyID:        principal.AgencyID,
			ClientID:        clientRecord.ID,
			CreatedByUserID: nullableUUID(principal.UserID),
			Title:           normalized.Title,
			Channel:         normalized.Channel,
			Status:          "new",
			Pages:           normalized.Pages,
			OwnerEmail:      normalized.OwnerEmail,
			SourceType:      normalized.SourceType,
			NextAction:      "Normalize intake brief",
		})
		if err != nil {
			return nil, fmt.Errorf("create brief: %w", err)
		}

		if _, err := queries.CreateBriefStatusHistory(ctx, dbgen.CreateBriefStatusHistoryParams{
			BriefID:         created.ID,
			FromStatus:      pgtype.Text{},
			ToStatus:        created.Status,
			ChangedByUserID: nullableUUID(principal.UserID),
			Note:            "Brief created",
		}); err != nil {
			return nil, fmt.Errorf("create brief status history: %w", err)
		}

		for _, document := range normalized.Documents {
			if _, err := queries.CreateBriefDocument(ctx, dbgen.CreateBriefDocumentParams{
				BriefID:          created.ID,
				StorageKey:       document.StorageKey,
				OriginalFilename: document.OriginalFilename,
				MediaType:        document.MediaType,
				ByteSize:         document.ByteSize,
				PageCount:        document.PageCount,
				UploadedByUserID: nullableUUID(principal.UserID),
			}); err != nil {
				return nil, fmt.Errorf("create brief document: %w", err)
			}
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &clientRecord.ID,
			BriefID:     &created.ID,
			EventType:   "brief.created",
			SubjectType: "brief",
			SubjectID:   &created.ID,
			Message:     fmt.Sprintf("Created brief %s", created.Title),
			Metadata: map[string]any{
				"client_name":    clientRecord.Name,
				"document_count": len(normalized.Documents),
				"source_type":    created.SourceType,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return s.loadDetailWithQueries(ctx, queries, created)
	})
}

func (s *Service) Launch(ctx context.Context, principal authctx.Principal, briefID uuid.UUID, input LaunchInput) (*LaunchResult, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("brief service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	normalized, err := normalizeLaunchInput(input)
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*LaunchResult, error) {
		queries := s.queries.WithTx(tx)

		record, err := queries.GetBriefByIDAndAgency(ctx, dbgen.GetBriefByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       briefID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrBriefNotFound
			}
			return nil, fmt.Errorf("get brief: %w", err)
		}

		if record.LaunchedAt.Valid || record.Status == "launched" {
			return nil, ErrBriefAlreadyLaunched
		}

		launchedAt := time.Now().UTC()
		updated, err := queries.UpdateBriefLaunchState(ctx, dbgen.UpdateBriefLaunchStateParams{
			AgencyID:   principal.AgencyID,
			ID:         record.ID,
			Status:     "launched",
			NextAction: "Campaign package launched",
			LaunchedAt: pgtype.Timestamptz{Time: launchedAt, Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("update brief launch state: %w", err)
		}

		if _, err := queries.CreateBriefStatusHistory(ctx, dbgen.CreateBriefStatusHistoryParams{
			BriefID:         updated.ID,
			FromStatus:      pgtype.Text{String: record.Status, Valid: true},
			ToStatus:        "launched",
			ChangedByUserID: nullableUUID(principal.UserID),
			Note:            "Brief launched into campaign execution",
		}); err != nil {
			return nil, fmt.Errorf("create brief launch history: %w", err)
		}

		campaign, err := queries.CreateCampaignFromBrief(ctx, dbgen.CreateCampaignFromBriefParams{
			AgencyID:         principal.AgencyID,
			OwnerUserID:      nullableUUID(principal.UserID),
			ClientID:         updated.ClientID,
			BriefID:          nullableUUID(updated.ID),
			Name:             normalized.CampaignNameOrDefault(updated.Title),
			Status:           "generating",
			BudgetCents:      normalized.BudgetCents,
			DueAt:            normalized.DueAt,
			ProgressPercent:  0,
			RiskLevel:        "medium",
			BudgetCurrency:   "USD",
			DeliverableCount: 0,
		})
		if err != nil {
			return nil, fmt.Errorf("create campaign from brief: %w", err)
		}

		if _, err := queries.CreateCampaignStatusHistory(ctx, dbgen.CreateCampaignStatusHistoryParams{
			CampaignID:      campaign.ID,
			FromStatus:      pgtype.Text{},
			ToStatus:        campaign.Status,
			ChangedByUserID: nullableUUID(principal.UserID),
			Note:            "Campaign created from brief launch",
		}); err != nil {
			return nil, fmt.Errorf("create campaign status history: %w", err)
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &updated.ClientID,
			BriefID:     &updated.ID,
			CampaignID:  &campaign.ID,
			EventType:   "brief.launched",
			SubjectType: "brief",
			SubjectID:   &updated.ID,
			Message:     fmt.Sprintf("Launched brief %s into campaign %s", updated.Title, campaign.Name),
			Metadata: map[string]any{
				"campaign_id":   campaign.ID.String(),
				"campaign_name": campaign.Name,
				"budget_cents":  campaign.BudgetCents,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		detail, err := s.loadDetailWithQueries(ctx, queries, updated)
		if err != nil {
			return nil, err
		}

		return &LaunchResult{
			Brief:      *detail,
			CampaignID: campaign.ID.String(),
		}, nil
	})
}

func (s *Service) loadDetail(ctx context.Context, briefRecord dbgen.Brief) (*Detail, error) {
	return s.loadDetailWithQueries(ctx, s.queries, briefRecord)
}

func (s *Service) loadDetailWithQueries(ctx context.Context, queries *dbgen.Queries, briefRecord dbgen.Brief) (*Detail, error) {
	docs, err := queries.ListBriefDocumentsByBrief(ctx, briefRecord.ID)
	if err != nil {
		return nil, fmt.Errorf("list brief documents: %w", err)
	}

	history, err := queries.ListBriefStatusHistoryByBrief(ctx, briefRecord.ID)
	if err != nil {
		return nil, fmt.Errorf("list brief history: %w", err)
	}

	clientRecord, err := queries.GetClientByIDAndAgency(ctx, dbgen.GetClientByIDAndAgencyParams{
		AgencyID: briefRecord.AgencyID,
		ID:       briefRecord.ClientID,
	})
	if err != nil {
		return nil, fmt.Errorf("get client for brief: %w", err)
	}

	detail := &Detail{
		Summary: Summary{
			ID:            briefRecord.ID.String(),
			ClientID:      briefRecord.ClientID.String(),
			ClientName:    clientRecord.Name,
			Title:         briefRecord.Title,
			Channel:       briefRecord.Channel,
			Status:        briefRecord.Status,
			Pages:         briefRecord.Pages,
			OwnerEmail:    briefRecord.OwnerEmail,
			SourceType:    briefRecord.SourceType,
			NextAction:    briefRecord.NextAction,
			DocumentCount: int64(len(docs)),
			CreatedAt:     briefRecord.CreatedAt,
			UpdatedAt:     briefRecord.UpdatedAt,
		},
		Documents: make([]Document, 0, len(docs)),
		History:   make([]StatusHistory, 0, len(history)),
	}

	if briefRecord.LaunchedAt.Valid {
		timestamp := briefRecord.LaunchedAt.Time
		detail.LaunchedAt = &timestamp
	}

	for _, doc := range docs {
		detail.Documents = append(detail.Documents, Document{
			ID:               doc.ID.String(),
			StorageKey:       doc.StorageKey,
			OriginalFilename: doc.OriginalFilename,
			MediaType:        doc.MediaType,
			ByteSize:         doc.ByteSize,
			PageCount:        doc.PageCount,
			CreatedAt:        doc.CreatedAt,
		})
	}

	for _, item := range history {
		entry := StatusHistory{
			ID:        item.ID.String(),
			ToStatus:  item.ToStatus,
			Note:      item.Note,
			CreatedAt: item.CreatedAt,
		}
		if item.FromStatus.Valid {
			value := item.FromStatus.String
			entry.FromStatus = &value
		}
		detail.History = append(detail.History, entry)
	}

	return detail, nil
}

type normalizedCreateInput struct {
	ClientID   string
	Title      string
	Channel    string
	Pages      int32
	OwnerEmail string
	SourceType string
	Documents  []DocumentInput
}

func normalizeCreateInput(input CreateInput, fallbackOwnerEmail string) (normalizedCreateInput, error) {
	clientID := strings.TrimSpace(input.ClientID)
	if clientID == "" {
		return normalizedCreateInput{}, fmt.Errorf("%w: client_id is required", ErrValidation)
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		return normalizedCreateInput{}, fmt.Errorf("%w: title is required", ErrValidation)
	}

	channel := strings.TrimSpace(input.Channel)
	if channel == "" {
		return normalizedCreateInput{}, fmt.Errorf("%w: channel is required", ErrValidation)
	}

	pages := input.Pages
	if pages < 0 {
		return normalizedCreateInput{}, fmt.Errorf("%w: pages must be zero or greater", ErrValidation)
	}

	ownerEmail := normalizeEmail(input.OwnerEmail)
	if ownerEmail == "" {
		ownerEmail = normalizeEmail(fallbackOwnerEmail)
	}
	if ownerEmail == "" {
		return normalizedCreateInput{}, fmt.Errorf("%w: owner_email is required", ErrValidation)
	}

	sourceType := normalizeSourceType(input.SourceType)

	documents := make([]DocumentInput, 0, len(input.Documents))
	for _, document := range input.Documents {
		normalizedDocument, err := normalizeDocumentInput(document)
		if err != nil {
			return normalizedCreateInput{}, err
		}
		documents = append(documents, normalizedDocument)
	}

	return normalizedCreateInput{
		ClientID:   clientID,
		Title:      title,
		Channel:    channel,
		Pages:      pages,
		OwnerEmail: ownerEmail,
		SourceType: sourceType,
		Documents:  documents,
	}, nil
}

type normalizedLaunchInput struct {
	CampaignName string
	BudgetCents  int64
	DueAt        pgtype.Timestamptz
}

func (n normalizedLaunchInput) CampaignNameOrDefault(title string) string {
	if n.CampaignName != "" {
		return n.CampaignName
	}
	return title
}

func normalizeLaunchInput(input LaunchInput) (normalizedLaunchInput, error) {
	if input.BudgetCents < 0 {
		return normalizedLaunchInput{}, fmt.Errorf("%w: budget_cents must be zero or greater", ErrValidation)
	}

	result := normalizedLaunchInput{
		CampaignName: strings.TrimSpace(input.CampaignName),
		BudgetCents:  input.BudgetCents,
	}

	if strings.TrimSpace(input.DueAt) != "" {
		dueAt, err := time.Parse(time.RFC3339, strings.TrimSpace(input.DueAt))
		if err != nil {
			return normalizedLaunchInput{}, fmt.Errorf("%w: due_at must be RFC3339", ErrValidation)
		}
		result.DueAt = pgtype.Timestamptz{Time: dueAt, Valid: true}
	}

	return result, nil
}

func normalizeDocumentInput(input DocumentInput) (DocumentInput, error) {
	filename := strings.TrimSpace(input.OriginalFilename)
	if filename == "" {
		return DocumentInput{}, fmt.Errorf("%w: original_filename is required", ErrValidation)
	}
	if input.ByteSize < 0 {
		return DocumentInput{}, fmt.Errorf("%w: byte_size must be zero or greater", ErrValidation)
	}
	if input.PageCount < 0 {
		return DocumentInput{}, fmt.Errorf("%w: page_count must be zero or greater", ErrValidation)
	}

	storageKey := strings.TrimSpace(input.StorageKey)
	if storageKey == "" {
		storageKey = filename
	}

	mediaType := strings.TrimSpace(input.MediaType)
	if mediaType == "" {
		mediaType = "application/octet-stream"
	}

	return DocumentInput{
		StorageKey:       storageKey,
		OriginalFilename: filename,
		MediaType:        mediaType,
		ByteSize:         input.ByteSize,
		PageCount:        input.PageCount,
	}, nil
}

func normalizeSourceType(raw string) string {
	value := strings.TrimSpace(strings.ToLower(raw))
	switch value {
	case "upload", "email", "api":
		return value
	default:
		return "manual"
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func nullableUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: true,
	}
}

func mapSummary(row dbgen.ListBriefsByAgencyRow) Summary {
	summary := Summary{
		ID:            row.ID.String(),
		ClientID:      row.ClientID.String(),
		ClientName:    row.ClientName,
		Title:         row.Title,
		Channel:       row.Channel,
		Status:        row.Status,
		Pages:         row.Pages,
		OwnerEmail:    row.OwnerEmail,
		SourceType:    row.SourceType,
		NextAction:    row.NextAction,
		DocumentCount: row.DocumentCount,
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}
	if row.LaunchedAt.Valid {
		timestamp := row.LaunchedAt.Time
		summary.LaunchedAt = &timestamp
	}
	return summary
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
