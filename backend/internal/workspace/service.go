package workspace

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
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

type defaultSettingGroup struct {
	Key         string
	Name        string
	Description string
	SortOrder   int32
	Items       []defaultSettingItem
}

type defaultSettingItem struct {
	Key       string
	Label     string
	Value     string
	SortOrder int32
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

func (s *Service) ListPlaybooks(ctx context.Context, principal authctx.Principal, pagination platformrequest.Pagination) ([]Playbook, int, error) {
	if s.queries == nil {
		return nil, 0, errors.New("workspace service is not configured with a database")
	}

	total, err := s.queries.CountPlaybooksByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, 0, fmt.Errorf("count playbooks: %w", err)
	}

	rows, err := s.queries.ListPlaybooksByAgency(ctx, dbgen.ListPlaybooksByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(pagination.PerPage),
		Offset:   int32(pagination.Offset()),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list playbooks: %w", err)
	}

	items := make([]Playbook, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapPlaybookRow(row))
	}

	return items, int(total), nil
}

func (s *Service) GetPlaybook(ctx context.Context, principal authctx.Principal, playbookID uuid.UUID) (*Playbook, error) {
	if s.queries == nil {
		return nil, errors.New("workspace service is not configured with a database")
	}

	row, err := s.queries.GetPlaybookSummaryByIDAndAgency(ctx, dbgen.GetPlaybookSummaryByIDAndAgencyParams{
		AgencyID: principal.AgencyID,
		ID:       playbookID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPlaybookNotFound
		}
		return nil, fmt.Errorf("get playbook: %w", err)
	}

	item := mapPlaybookSummary(row)
	return &item, nil
}

func (s *Service) CreatePlaybook(ctx context.Context, principal authctx.Principal, input CreatePlaybookInput) (*Playbook, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("workspace service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	normalized, err := normalizeCreatePlaybook(input)
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Playbook, error) {
		queries := s.queries.WithTx(tx)

		created, err := queries.CreatePlaybook(ctx, dbgen.CreatePlaybookParams{
			AgencyID:    principal.AgencyID,
			Name:        normalized.Name,
			Category:    normalized.Category,
			OwnerUserID: nullableUUID(principal.UserID),
			Status:      normalized.Status,
			Body:        normalized.Body,
			PublishedAt: publishedAtForStatus(normalized.Status, pgtype.Timestamptz{}),
		})
		if err != nil {
			if isUniqueViolation(err) {
				return nil, ErrPlaybookNameUsed
			}
			return nil, fmt.Errorf("create playbook: %w", err)
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			EventType:   "playbook.created",
			SubjectType: "playbook",
			SubjectID:   uuidPtr(created.ID),
			Message:     fmt.Sprintf("Created playbook %s", created.Name),
			Metadata: map[string]any{
				"category": created.Category,
				"status":   created.Status,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		row, err := queries.GetPlaybookSummaryByIDAndAgency(ctx, dbgen.GetPlaybookSummaryByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       created.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("reload playbook: %w", err)
		}

		item := mapPlaybookSummary(row)
		return &item, nil
	})
}

func (s *Service) UpdatePlaybook(ctx context.Context, principal authctx.Principal, playbookID uuid.UUID, input UpdatePlaybookInput) (*Playbook, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("workspace service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Playbook, error) {
		queries := s.queries.WithTx(tx)

		current, err := queries.GetPlaybookByIDAndAgency(ctx, dbgen.GetPlaybookByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       playbookID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrPlaybookNotFound
			}
			return nil, fmt.Errorf("get playbook: %w", err)
		}

		normalized, err := normalizeUpdatePlaybook(current, input)
		if err != nil {
			return nil, err
		}

		updated, err := queries.UpdatePlaybook(ctx, dbgen.UpdatePlaybookParams{
			AgencyID:    principal.AgencyID,
			ID:          current.ID,
			Name:        normalized.Name,
			Category:    normalized.Category,
			Status:      normalized.Status,
			Body:        normalized.Body,
			PublishedAt: publishedAtForStatus(normalized.Status, current.PublishedAt),
		})
		if err != nil {
			if isUniqueViolation(err) {
				return nil, ErrPlaybookNameUsed
			}
			return nil, fmt.Errorf("update playbook: %w", err)
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			EventType:   "playbook.updated",
			SubjectType: "playbook",
			SubjectID:   uuidPtr(updated.ID),
			Message:     fmt.Sprintf("Updated playbook %s", updated.Name),
			Metadata: map[string]any{
				"status": updated.Status,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		row, err := queries.GetPlaybookSummaryByIDAndAgency(ctx, dbgen.GetPlaybookSummaryByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       updated.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("reload playbook: %w", err)
		}

		item := mapPlaybookSummary(row)
		return &item, nil
	})
}

func (s *Service) GetSettings(ctx context.Context, principal authctx.Principal) ([]SettingGroup, error) {
	if s.queries == nil {
		return nil, errors.New("workspace service is not configured with a database")
	}

	groups, err := s.loadSettings(ctx, s.queries, principal.AgencyID)
	if err != nil {
		return nil, err
	}
	if len(groups) > 0 || s.db == nil {
		return groups, nil
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) ([]SettingGroup, error) {
		queries := s.queries.WithTx(tx)
		if err := ensureDefaultSettings(ctx, queries, principal.AgencyID); err != nil {
			return nil, err
		}
		return s.loadSettings(ctx, queries, principal.AgencyID)
	})
}

func (s *Service) UpdateSettings(ctx context.Context, principal authctx.Principal, input UpdateSettingsInput) ([]SettingGroup, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("workspace service is not configured with a database")
	}
	if err := authz.RequireAdmin(principal); err != nil {
		return nil, err
	}
	if len(input.Items) == 0 {
		return nil, fmt.Errorf("%w: at least one setting item update is required", ErrValidation)
	}

	updates, err := normalizeSettingUpdates(input.Items)
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) ([]SettingGroup, error) {
		queries := s.queries.WithTx(tx)
		if err := ensureDefaultSettings(ctx, queries, principal.AgencyID); err != nil {
			return nil, err
		}

		for _, update := range updates {
			item, err := queries.GetSettingItemByGroupKeyAndItemKey(ctx, dbgen.GetSettingItemByGroupKeyAndItemKeyParams{
				AgencyID: principal.AgencyID,
				Key:      update.GroupKey,
				Key_2:    update.ItemKey,
			})
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return nil, fmt.Errorf("%w: unknown setting %s.%s", ErrValidation, update.GroupKey, update.ItemKey)
				}
				return nil, fmt.Errorf("get setting item: %w", err)
			}
			if _, err := queries.UpdateSettingItem(ctx, dbgen.UpdateSettingItemParams{
				ID:    item.ID,
				Value: update.Value,
			}); err != nil {
				return nil, fmt.Errorf("update setting item: %w", err)
			}
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			EventType:   "settings.updated",
			SubjectType: "workspace",
			Message:     "Updated workspace settings",
			Metadata: map[string]any{
				"item_count": len(updates),
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return s.loadSettings(ctx, queries, principal.AgencyID)
	})
}

func (s *Service) ListActivity(ctx context.Context, principal authctx.Principal, limit int) ([]ActivityItem, error) {
	if s.queries == nil {
		return nil, errors.New("workspace service is not configured with a database")
	}

	rows, err := s.queries.ListActivityEventsByAgency(ctx, dbgen.ListActivityEventsByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("list activity events: %w", err)
	}

	items := make([]ActivityItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapActivity(row))
	}
	return items, nil
}

func (s *Service) loadSettings(ctx context.Context, queries *dbgen.Queries, agencyID uuid.UUID) ([]SettingGroup, error) {
	groupRows, err := queries.ListSettingGroupsByAgency(ctx, agencyID)
	if err != nil {
		return nil, fmt.Errorf("list setting groups: %w", err)
	}
	if len(groupRows) == 0 {
		return []SettingGroup{}, nil
	}

	groupIDs := make([]uuid.UUID, 0, len(groupRows))
	for _, group := range groupRows {
		groupIDs = append(groupIDs, group.ID)
	}

	itemRows, err := queries.ListSettingItemsByGroupIDs(ctx, groupIDs)
	if err != nil {
		return nil, fmt.Errorf("list setting items: %w", err)
	}

	itemsByGroup := make(map[uuid.UUID][]SettingItem, len(groupRows))
	for _, item := range itemRows {
		itemsByGroup[item.SettingGroupID] = append(itemsByGroup[item.SettingGroupID], mapSettingItem(item))
	}

	settings := make([]SettingGroup, 0, len(groupRows))
	for _, group := range groupRows {
		settings = append(settings, SettingGroup{
			ID:          group.ID.String(),
			Key:         group.Key,
			Name:        group.Name,
			Description: group.Description,
			SortOrder:   group.SortOrder,
			Items:       slices.Clone(itemsByGroup[group.ID]),
			CreatedAt:   group.CreatedAt,
			UpdatedAt:   group.UpdatedAt,
		})
	}

	return settings, nil
}

func ensureDefaultSettings(ctx context.Context, queries *dbgen.Queries, agencyID uuid.UUID) error {
	existing, err := queries.ListSettingGroupsByAgency(ctx, agencyID)
	if err != nil {
		return fmt.Errorf("list setting groups: %w", err)
	}
	if len(existing) > 0 {
		return nil
	}

	agency, err := queries.GetAgencyByID(ctx, agencyID)
	if err != nil {
		return fmt.Errorf("get agency: %w", err)
	}

	for _, group := range defaultSettings(agency.Name) {
		createdGroup, err := queries.CreateSettingGroup(ctx, dbgen.CreateSettingGroupParams{
			AgencyID:    agencyID,
			Key:         group.Key,
			Name:        group.Name,
			Description: group.Description,
			SortOrder:   group.SortOrder,
		})
		if err != nil {
			return fmt.Errorf("create setting group: %w", err)
		}

		for _, item := range group.Items {
			if _, err := queries.CreateSettingItem(ctx, dbgen.CreateSettingItemParams{
				SettingGroupID: createdGroup.ID,
				Key:            item.Key,
				Label:          item.Label,
				Value:          item.Value,
				SortOrder:      item.SortOrder,
			}); err != nil {
				return fmt.Errorf("create setting item: %w", err)
			}
		}
	}

	return nil
}

func defaultSettings(agencyName string) []defaultSettingGroup {
	return []defaultSettingGroup{
		{
			Key:         "workspace_identity",
			Name:        "Workspace identity",
			Description: "Default brand presentation across client-facing surfaces.",
			SortOrder:   0,
			Items: []defaultSettingItem{
				{Key: "primary_brand", Label: "Primary brand", Value: agencyName, SortOrder: 0},
				{Key: "default_portal_theme", Label: "Default portal theme", Value: "Graphite / Lime", SortOrder: 1},
				{Key: "presentation_mode", Label: "Presentation mode", Value: "White-label enabled", SortOrder: 2},
			},
		},
		{
			Key:         "notifications",
			Name:        "Notifications",
			Description: "How the team is alerted during delivery and review.",
			SortOrder:   1,
			Items: []defaultSettingItem{
				{Key: "approval_alerts", Label: "Approval alerts", Value: "Instant", SortOrder: 0},
				{Key: "risk_escalation", Label: "Risk escalation", Value: "Slack + email", SortOrder: 1},
				{Key: "client_digest", Label: "Client digest", Value: "Daily 08:00", SortOrder: 2},
			},
		},
		{
			Key:         "permissions",
			Name:        "Permissions",
			Description: "Access boundaries for internal roles and clients.",
			SortOrder:   2,
			Items: []defaultSettingItem{
				{Key: "client_comments", Label: "Client comments", Value: "Enabled", SortOrder: 0},
				{Key: "publishing_rights", Label: "Publishing rights", Value: "Directors only", SortOrder: 1},
				{Key: "document_exports", Label: "Document exports", Value: "Tracked", SortOrder: 2},
			},
		},
	}
}

func normalizeCreatePlaybook(input CreatePlaybookInput) (CreatePlaybookInput, error) {
	name := strings.TrimSpace(input.Name)
	category := strings.TrimSpace(input.Category)
	status := strings.TrimSpace(strings.ToLower(input.Status))
	if name == "" {
		return CreatePlaybookInput{}, fmt.Errorf("%w: name is required", ErrValidation)
	}
	if category == "" {
		category = "Operations"
	}
	if status == "" {
		status = "draft"
	}
	if !isValidPlaybookStatus(status) {
		return CreatePlaybookInput{}, fmt.Errorf("%w: status must be one of draft, published, archived", ErrValidation)
	}

	return CreatePlaybookInput{
		Name:     name,
		Category: category,
		Status:   status,
		Body:     strings.TrimSpace(input.Body),
	}, nil
}

func normalizeUpdatePlaybook(current dbgen.Playbook, input UpdatePlaybookInput) (CreatePlaybookInput, error) {
	merged := CreatePlaybookInput{
		Name:     current.Name,
		Category: current.Category,
		Status:   current.Status,
		Body:     current.Body,
	}

	if input.Name != nil {
		merged.Name = *input.Name
	}
	if input.Category != nil {
		merged.Category = *input.Category
	}
	if input.Status != nil {
		merged.Status = *input.Status
	}
	if input.Body != nil {
		merged.Body = *input.Body
	}

	return normalizeCreatePlaybook(merged)
}

func normalizeSettingUpdates(items []SettingItemUpdateInput) ([]SettingItemUpdateInput, error) {
	normalized := make([]SettingItemUpdateInput, 0, len(items))
	seen := make(map[string]struct{}, len(items))

	for _, item := range items {
		groupKey := strings.TrimSpace(strings.ToLower(item.GroupKey))
		itemKey := strings.TrimSpace(strings.ToLower(item.ItemKey))
		if groupKey == "" || itemKey == "" {
			return nil, fmt.Errorf("%w: group_key and item_key are required", ErrValidation)
		}

		key := groupKey + "." + itemKey
		if _, ok := seen[key]; ok {
			return nil, fmt.Errorf("%w: duplicate setting update for %s", ErrValidation, key)
		}

		normalized = append(normalized, SettingItemUpdateInput{
			GroupKey: groupKey,
			ItemKey:  itemKey,
			Value:    strings.TrimSpace(item.Value),
		})
		seen[key] = struct{}{}
	}

	return normalized, nil
}

func publishedAtForStatus(status string, current pgtype.Timestamptz) pgtype.Timestamptz {
	if status != "published" {
		return pgtype.Timestamptz{}
	}
	if current.Valid {
		return current
	}
	return pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
}

func isValidPlaybookStatus(status string) bool {
	switch status {
	case "draft", "published", "archived":
		return true
	default:
		return false
	}
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func nullableUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: true,
	}
}

func uuidPtr(id uuid.UUID) *uuid.UUID {
	return &id
}

func timePtr(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	timestamp := value.Time
	return &timestamp
}

func mapPlaybookRow(row dbgen.ListPlaybooksByAgencyRow) Playbook {
	item := Playbook{
		ID:        row.ID.String(),
		Name:      row.Name,
		Category:  row.Category,
		OwnerName: row.OwnerName,
		Status:    row.Status,
		Body:      row.Body,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
	item.PublishedAt = timePtr(row.PublishedAt)
	return item
}

func mapPlaybookSummary(row dbgen.GetPlaybookSummaryByIDAndAgencyRow) Playbook {
	item := Playbook{
		ID:        row.ID.String(),
		Name:      row.Name,
		Category:  row.Category,
		OwnerName: row.OwnerName,
		Status:    row.Status,
		Body:      row.Body,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
	item.PublishedAt = timePtr(row.PublishedAt)
	return item
}

func mapSettingItem(row dbgen.SettingItem) SettingItem {
	return SettingItem{
		ID:        row.ID.String(),
		Key:       row.Key,
		Label:     row.Label,
		Value:     row.Value,
		SortOrder: row.SortOrder,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
}

func mapActivity(row dbgen.ActivityEvent) ActivityItem {
	return ActivityItem{
		ID:          row.ID.String(),
		EventType:   row.EventType,
		SubjectType: row.SubjectType,
		Message:     row.Message,
		Icon:        iconForEvent(row.EventType),
		Metadata:    decodeMetadata(row.Metadata),
		OccurredAt:  row.OccurredAt,
	}
}

func decodeMetadata(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}

	var metadata map[string]any
	if err := json.Unmarshal(raw, &metadata); err != nil {
		return map[string]any{}
	}
	if metadata == nil {
		return map[string]any{}
	}
	return metadata
}

func iconForEvent(eventType string) string {
	switch {
	case strings.Contains(eventType, "approved"):
		return "OK"
	case strings.Contains(eventType, "created"), strings.Contains(eventType, "uploaded"):
		return "+"
	case strings.Contains(eventType, "updated"):
		return "*"
	case strings.Contains(eventType, "published"):
		return ">>"
	default:
		return "[]"
	}
}
