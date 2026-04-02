package portal

import (
	"context"
	"encoding/json"
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
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	platformrequest "github.com/nyashahama/AgencyForge/backend/internal/platform/request"
)

type Service struct {
	db      *database.Pool
	queries *dbgen.Queries
}

type normalizedReviewFlow struct {
	Name       string
	ReviewMode string
	ConfigJSON []byte
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
		return nil, 0, errors.New("portal service is not configured with a database")
	}

	total, err := s.queries.CountPortalsByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, 0, fmt.Errorf("count portals: %w", err)
	}

	rows, err := s.queries.ListPortalsByAgency(ctx, dbgen.ListPortalsByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(pagination.PerPage),
		Offset:   int32(pagination.Offset()),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list portals: %w", err)
	}

	items := make([]Summary, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapPortalSummaryRow(row))
	}

	return items, int(total), nil
}

func (s *Service) Get(ctx context.Context, principal authctx.Principal, portalID uuid.UUID) (*Detail, error) {
	if s.queries == nil {
		return nil, errors.New("portal service is not configured with a database")
	}

	if _, err := s.queries.GetPortalByIDAndAgency(ctx, dbgen.GetPortalByIDAndAgencyParams{
		AgencyID: principal.AgencyID,
		ID:       portalID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPortalNotFound
		}
		return nil, fmt.Errorf("get portal: %w", err)
	}

	return loadDetailWithQueries(ctx, s.queries, principal.AgencyID, portalID)
}

func (s *Service) Update(ctx context.Context, principal authctx.Principal, portalID uuid.UUID, input UpdateInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("portal service is not configured with a database")
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)

		current, err := queries.GetPortalByIDAndAgency(ctx, dbgen.GetPortalByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       portalID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrPortalNotFound
			}
			return nil, fmt.Errorf("get portal: %w", err)
		}

		name := current.Name
		if input.Name != nil {
			name = strings.TrimSpace(*input.Name)
			if name == "" {
				return nil, fmt.Errorf("%w: name cannot be empty", ErrValidation)
			}
		}

		theme := current.Theme
		if input.Theme != nil {
			theme = normalizeTheme(*input.Theme, current.Theme)
		}

		reviewMode := current.ReviewMode
		if input.ReviewMode != nil {
			reviewMode, err = normalizeReviewMode(*input.ReviewMode, current.ReviewMode)
			if err != nil {
				return nil, err
			}
		}

		description := current.Description
		if input.Description != nil {
			description = strings.TrimSpace(*input.Description)
		}

		shareState := current.ShareState
		if input.ShareState != nil {
			shareState, err = normalizeUpdateShareState(*input.ShareState, current.ShareState)
			if err != nil {
				return nil, err
			}
		}

		publishedAt := current.PublishedAt
		lastPublishedAt := current.LastPublishedAt
		if shareState != "published" {
			publishedAt = pgtype.Timestamptz{}
		}

		updated, err := queries.UpdatePortal(ctx, dbgen.UpdatePortalParams{
			AgencyID:        principal.AgencyID,
			ID:              current.ID,
			Name:            name,
			Theme:           theme,
			ReviewMode:      reviewMode,
			ShareState:      shareState,
			Description:     description,
			PublishedAt:     publishedAt,
			LastPublishedAt: lastPublishedAt,
		})
		if err != nil {
			return nil, fmt.Errorf("update portal: %w", err)
		}

		reviewFlowInput, err := normalizeReviewFlowInput(input.DefaultReviewFlow, reviewMode, updated.Name)
		if err != nil {
			return nil, err
		}
		if err := ensureDefaultReviewFlow(ctx, queries, updated.ID, reviewFlowInput); err != nil {
			return nil, err
		}

		if current.ShareState == "published" && shareState != "published" {
			if err := queries.RevokeActivePortalSharesByPortal(ctx, updated.ID); err != nil {
				return nil, fmt.Errorf("revoke portal shares: %w", err)
			}
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &updated.ClientID,
			PortalID:    &updated.ID,
			EventType:   "portal.updated",
			SubjectType: "portal",
			SubjectID:   &updated.ID,
			Message:     fmt.Sprintf("Updated portal %s", updated.Name),
			Metadata: map[string]any{
				"share_state": shareState,
				"review_mode": reviewMode,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, principal.AgencyID, updated.ID)
	})
}

func (s *Service) Publish(ctx context.Context, principal authctx.Principal, portalID uuid.UUID, input PublishInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("portal service is not configured with a database")
	}

	expiresAt, err := parseOptionalTime(input.ShareExpiresAt, "share_expires_at")
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)

		current, err := queries.GetPortalByIDAndAgency(ctx, dbgen.GetPortalByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       portalID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrPortalNotFound
			}
			return nil, fmt.Errorf("get portal: %w", err)
		}

		defaultFlow, err := getOrCreateDefaultReviewFlow(ctx, queries, current)
		if err != nil {
			return nil, err
		}

		latestVersion := int32(0)
		latestPublication, err := queries.GetLatestPortalPublicationByPortal(ctx, current.ID)
		if err == nil {
			latestVersion = latestPublication.VersionNumber
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("get latest portal publication: %w", err)
		}

		publishedAt := time.Now().UTC()
		payload, err := buildPublicationPayload(current, defaultFlow, input.Payload)
		if err != nil {
			return nil, err
		}

		if err := queries.SupersedePublishedPortalPublications(ctx, current.ID); err != nil {
			return nil, fmt.Errorf("supersede published portal versions: %w", err)
		}

		if _, err := queries.CreatePortalPublication(ctx, dbgen.CreatePortalPublicationParams{
			PortalID:          current.ID,
			VersionNumber:     latestVersion + 1,
			Status:            "published",
			PublishedByUserID: nullableUUID(principal.UserID),
			Payload:           payload,
			PublishedAt:       pgtype.Timestamptz{Time: publishedAt, Valid: true},
		}); err != nil {
			return nil, fmt.Errorf("create portal publication: %w", err)
		}

		activeShare, err := queries.GetActivePortalShareByPortal(ctx, current.ID)
		switch {
		case err == nil:
			if _, err := queries.UpdatePortalShare(ctx, dbgen.UpdatePortalShareParams{
				ID:        activeShare.ID,
				PortalID:  current.ID,
				Status:    "active",
				ExpiresAt: expiresAt,
			}); err != nil {
				return nil, fmt.Errorf("update portal share: %w", err)
			}
		case errors.Is(err, pgx.ErrNoRows):
			if _, err := queries.CreatePortalShare(ctx, dbgen.CreatePortalShareParams{
				PortalID:  current.ID,
				Status:    "active",
				ExpiresAt: expiresAt,
			}); err != nil {
				return nil, fmt.Errorf("create portal share: %w", err)
			}
		default:
			return nil, fmt.Errorf("get active portal share: %w", err)
		}

		updated, err := queries.UpdatePortal(ctx, dbgen.UpdatePortalParams{
			AgencyID:        principal.AgencyID,
			ID:              current.ID,
			Name:            current.Name,
			Theme:           current.Theme,
			ReviewMode:      current.ReviewMode,
			ShareState:      "published",
			Description:     current.Description,
			PublishedAt:     pgtype.Timestamptz{Time: publishedAt, Valid: true},
			LastPublishedAt: pgtype.Timestamptz{Time: publishedAt, Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("update published portal state: %w", err)
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &updated.ClientID,
			PortalID:    &updated.ID,
			EventType:   "portal.published",
			SubjectType: "portal",
			SubjectID:   &updated.ID,
			Message:     fmt.Sprintf("Published portal %s", updated.Name),
			Metadata: map[string]any{
				"version_number": latestVersion + 1,
				"share_state":    updated.ShareState,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, principal.AgencyID, updated.ID)
	})
}

func loadDetailWithQueries(ctx context.Context, queries *dbgen.Queries, agencyID uuid.UUID, portalID uuid.UUID) (*Detail, error) {
	summary, err := queries.GetPortalSummaryByIDAndAgency(ctx, dbgen.GetPortalSummaryByIDAndAgencyParams{
		AgencyID: agencyID,
		ID:       portalID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPortalNotFound
		}
		return nil, fmt.Errorf("get portal summary: %w", err)
	}

	flows, err := queries.ListPortalReviewFlowsByPortal(ctx, portalID)
	if err != nil {
		return nil, fmt.Errorf("list portal review flows: %w", err)
	}

	publications, err := queries.ListPortalPublicationsByPortal(ctx, portalID)
	if err != nil {
		return nil, fmt.Errorf("list portal publications: %w", err)
	}

	shares, err := queries.ListPortalSharesByPortal(ctx, portalID)
	if err != nil {
		return nil, fmt.Errorf("list portal shares: %w", err)
	}

	detail := &Detail{
		Summary:      mapPortalSummary(summary),
		ReviewFlows:  make([]ReviewFlow, 0, len(flows)),
		Publications: make([]Publication, 0, len(publications)),
		Shares:       make([]Share, 0, len(shares)),
	}

	for _, flow := range flows {
		detail.ReviewFlows = append(detail.ReviewFlows, mapReviewFlow(flow))
	}
	for _, publication := range publications {
		detail.Publications = append(detail.Publications, mapPublication(publication))
	}
	for _, share := range shares {
		detail.Shares = append(detail.Shares, mapShare(share))
	}

	return detail, nil
}

func getOrCreateDefaultReviewFlow(ctx context.Context, queries *dbgen.Queries, portalRecord dbgen.Portal) (dbgen.PortalReviewFlow, error) {
	flow, err := queries.GetDefaultPortalReviewFlowByPortal(ctx, portalRecord.ID)
	switch {
	case err == nil:
		return flow, nil
	case !errors.Is(err, pgx.ErrNoRows):
		return dbgen.PortalReviewFlow{}, fmt.Errorf("get default review flow: %w", err)
	}

	config, err := json.Marshal(defaultReviewFlowConfig())
	if err != nil {
		return dbgen.PortalReviewFlow{}, fmt.Errorf("marshal default review flow config: %w", err)
	}

	created, err := queries.CreatePortalReviewFlow(ctx, dbgen.CreatePortalReviewFlowParams{
		PortalID:   portalRecord.ID,
		Name:       portalRecord.Name + " Default Flow",
		ReviewMode: portalRecord.ReviewMode,
		ConfigJson: config,
		IsDefault:  true,
	})
	if err != nil {
		return dbgen.PortalReviewFlow{}, fmt.Errorf("create default review flow: %w", err)
	}

	return created, nil
}

func ensureDefaultReviewFlow(ctx context.Context, queries *dbgen.Queries, portalID uuid.UUID, input normalizedReviewFlow) error {
	flow, err := queries.GetDefaultPortalReviewFlowByPortal(ctx, portalID)
	switch {
	case err == nil:
		_, err = queries.UpdatePortalReviewFlow(ctx, dbgen.UpdatePortalReviewFlowParams{
			ID:         flow.ID,
			PortalID:   portalID,
			Name:       input.Name,
			ReviewMode: input.ReviewMode,
			ConfigJson: input.ConfigJSON,
			IsDefault:  true,
		})
		if err != nil {
			return fmt.Errorf("update default review flow: %w", err)
		}
		return nil
	case !errors.Is(err, pgx.ErrNoRows):
		return fmt.Errorf("get default review flow: %w", err)
	}

	if _, err := queries.CreatePortalReviewFlow(ctx, dbgen.CreatePortalReviewFlowParams{
		PortalID:   portalID,
		Name:       input.Name,
		ReviewMode: input.ReviewMode,
		ConfigJson: input.ConfigJSON,
		IsDefault:  true,
	}); err != nil {
		return fmt.Errorf("create default review flow: %w", err)
	}

	return nil
}

func normalizeTheme(raw string, fallback string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return fallback
	}
	return value
}

func normalizeReviewMode(raw string, fallback string) (string, error) {
	value := strings.TrimSpace(strings.ToLower(raw))
	if value == "" {
		value = fallback
	}

	switch value {
	case "stage-gate", "rolling-review", "compliance-first", "custom":
		return value, nil
	default:
		return "", fmt.Errorf("%w: review_mode must be one of stage-gate, rolling-review, compliance-first, custom", ErrValidation)
	}
}

func normalizeUpdateShareState(raw string, fallback string) (string, error) {
	value := strings.TrimSpace(strings.ToLower(raw))
	if value == "" {
		value = fallback
	}

	switch value {
	case "draft", "archived":
		return value, nil
	case "published":
		return "", fmt.Errorf("%w: use the publish endpoint to move a portal to published", ErrValidation)
	default:
		return "", fmt.Errorf("%w: share_state must be one of draft or archived", ErrValidation)
	}
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

func normalizeReviewFlowInput(input *ReviewFlowInput, reviewMode string, portalName string) (normalizedReviewFlow, error) {
	name := portalName + " Default Flow"
	config := defaultReviewFlowConfig()

	if input != nil {
		if trimmed := strings.TrimSpace(input.Name); trimmed != "" {
			name = trimmed
		}

		var err error
		reviewMode, err = normalizeReviewMode(input.ReviewMode, reviewMode)
		if err != nil {
			return normalizedReviewFlow{}, err
		}

		if input.Config != nil {
			config = input.Config
		}
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		return normalizedReviewFlow{}, fmt.Errorf("%w: review flow config must be valid JSON", ErrValidation)
	}

	return normalizedReviewFlow{
		Name:       name,
		ReviewMode: reviewMode,
		ConfigJSON: configJSON,
	}, nil
}

func defaultReviewFlowConfig() map[string]any {
	return map[string]any{
		"steps": []string{"creative-review", "client-review", "publish"},
	}
}

func buildPublicationPayload(portalRecord dbgen.Portal, flow dbgen.PortalReviewFlow, payload map[string]any) ([]byte, error) {
	body := map[string]any{
		"name":         portalRecord.Name,
		"slug":         portalRecord.Slug,
		"theme":        portalRecord.Theme,
		"review_mode":  portalRecord.ReviewMode,
		"description":  portalRecord.Description,
		"default_flow": decodeJSONMap(flow.ConfigJson),
	}

	for key, value := range payload {
		body[key] = value
	}

	encoded, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("%w: publish payload must be valid JSON", ErrValidation)
	}

	return encoded, nil
}

func decodeJSONMap(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}

	var value map[string]any
	if err := json.Unmarshal(raw, &value); err != nil {
		return map[string]any{}
	}
	if value == nil {
		return map[string]any{}
	}
	return value
}

func timePtr(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	timestamp := value.Time
	return &timestamp
}

func nullableUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: true,
	}
}

func uuidPtrString(value pgtype.UUID) *string {
	if !value.Valid {
		return nil
	}
	id := uuid.UUID(value.Bytes).String()
	return &id
}

func mapPortalSummaryRow(row dbgen.ListPortalsByAgencyRow) Summary {
	return Summary{
		ID:                       row.ID.String(),
		ClientID:                 row.ClientID.String(),
		ClientName:               row.ClientName,
		Name:                     row.Name,
		Slug:                     row.Slug,
		Theme:                    row.Theme,
		ReviewMode:               row.ReviewMode,
		ShareState:               row.ShareState,
		Description:              row.Description,
		LatestPublicationVersion: row.LatestPublicationVersion,
		ActiveShareCount:         row.ActiveShareCount,
		PublishedAt:              timePtr(row.PublishedAt),
		LastPublishedAt:          timePtr(row.LastPublishedAt),
		CreatedAt:                row.CreatedAt,
		UpdatedAt:                row.UpdatedAt,
	}
}

func mapPortalSummary(row dbgen.GetPortalSummaryByIDAndAgencyRow) Summary {
	return Summary{
		ID:                       row.ID.String(),
		ClientID:                 row.ClientID.String(),
		ClientName:               row.ClientName,
		Name:                     row.Name,
		Slug:                     row.Slug,
		Theme:                    row.Theme,
		ReviewMode:               row.ReviewMode,
		ShareState:               row.ShareState,
		Description:              row.Description,
		LatestPublicationVersion: row.LatestPublicationVersion,
		ActiveShareCount:         row.ActiveShareCount,
		PublishedAt:              timePtr(row.PublishedAt),
		LastPublishedAt:          timePtr(row.LastPublishedAt),
		CreatedAt:                row.CreatedAt,
		UpdatedAt:                row.UpdatedAt,
	}
}

func mapReviewFlow(flow dbgen.PortalReviewFlow) ReviewFlow {
	return ReviewFlow{
		ID:         flow.ID.String(),
		Name:       flow.Name,
		ReviewMode: flow.ReviewMode,
		Config:     decodeJSONMap(flow.ConfigJson),
		IsDefault:  flow.IsDefault,
		CreatedAt:  flow.CreatedAt,
		UpdatedAt:  flow.UpdatedAt,
	}
}

func mapPublication(publication dbgen.PortalPublication) Publication {
	return Publication{
		ID:                publication.ID.String(),
		VersionNumber:     publication.VersionNumber,
		Status:            publication.Status,
		PublishedByUserID: uuidPtrString(publication.PublishedByUserID),
		Payload:           decodeJSONMap(publication.Payload),
		PublishedAt:       timePtr(publication.PublishedAt),
		CreatedAt:         publication.CreatedAt,
		UpdatedAt:         publication.UpdatedAt,
	}
}

func mapShare(share dbgen.PortalShare) Share {
	return Share{
		ID:             share.ID.String(),
		AccessToken:    share.AccessToken.String(),
		Status:         share.Status,
		ExpiresAt:      timePtr(share.ExpiresAt),
		LastAccessedAt: timePtr(share.LastAccessedAt),
		CreatedAt:      share.CreatedAt,
		UpdatedAt:      share.UpdatedAt,
	}
}
