package client

import (
	"context"
	"errors"
	"fmt"
	"regexp"
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
		return nil, 0, errors.New("client service is not configured with a database")
	}

	total, err := s.queries.CountClientsByAgency(ctx, principal.AgencyID)
	if err != nil {
		return nil, 0, fmt.Errorf("count clients: %w", err)
	}

	rows, err := s.queries.ListClientsByAgency(ctx, dbgen.ListClientsByAgencyParams{
		AgencyID: principal.AgencyID,
		Limit:    int32(pagination.PerPage),
		Offset:   int32(pagination.Offset()),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list clients: %w", err)
	}

	items := make([]Summary, 0, len(rows))
	for _, row := range rows {
		items = append(items, mapSummary(row))
	}

	return items, int(total), nil
}

func (s *Service) Get(ctx context.Context, principal authctx.Principal, clientID uuid.UUID) (*Detail, error) {
	if s.queries == nil {
		return nil, errors.New("client service is not configured with a database")
	}

	clientRecord, err := s.queries.GetClientByIDAndAgency(ctx, dbgen.GetClientByIDAndAgencyParams{
		AgencyID: principal.AgencyID,
		ID:       clientID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrClientNotFound
		}
		return nil, fmt.Errorf("get client: %w", err)
	}

	return s.loadDetail(ctx, clientRecord)
}

func (s *Service) Create(ctx context.Context, principal authctx.Principal, input CreateInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("client service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	normalized, err := normalizeCreateInput(input)
	if err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)
		created, err := queries.CreateClient(ctx, dbgen.CreateClientParams{
			AgencyID:           principal.AgencyID,
			OwnerUserID:        nullableUUID(principal.UserID),
			Name:               normalized.Name,
			Slug:               normalized.Slug,
			LeadEmail:          normalized.LeadEmail,
			Health:             normalized.Health,
			Notes:              normalized.Notes,
			MrrCents:           normalized.MrrCents,
			OpenApprovalsCount: normalized.OpenApprovalsCount,
		})
		if err != nil {
			if isUniqueViolation(err) {
				return nil, ErrClientSlugTaken
			}
			return nil, fmt.Errorf("create client: %w", err)
		}

		if _, err := queries.UpsertPrimaryClientContact(ctx, dbgen.UpsertPrimaryClientContactParams{
			ClientID: created.ID,
			Name:     normalized.PrimaryContact.Name,
			Email:    normalized.PrimaryContact.Email,
			Role:     normalized.PrimaryContact.Role,
		}); err != nil {
			return nil, fmt.Errorf("upsert primary contact: %w", err)
		}

		if normalized.InitialTouchpoint != "" {
			if _, err := createTouchpoint(ctx, queries, principal, created.AgencyID, created.ID, normalized.InitialTouchpoint); err != nil {
				return nil, err
			}
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &created.ID,
			EventType:   "client.created",
			SubjectType: "client",
			SubjectID:   &created.ID,
			Message:     fmt.Sprintf("Created client %s", created.Name),
			Metadata: map[string]any{
				"slug":            created.Slug,
				"lead_email":      created.LeadEmail,
				"primary_contact": normalized.PrimaryContact.Email,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, created)
	})
}

func (s *Service) Update(ctx context.Context, principal authctx.Principal, clientID uuid.UUID, input UpdateInput) (*Detail, error) {
	if s.queries == nil || s.db == nil {
		return nil, errors.New("client service is not configured with a database")
	}
	if err := authz.RequireWriter(principal); err != nil {
		return nil, err
	}

	return database.InTx(ctx, s.db, func(tx pgx.Tx) (*Detail, error) {
		queries := s.queries.WithTx(tx)

		current, err := queries.GetClientByIDAndAgency(ctx, dbgen.GetClientByIDAndAgencyParams{
			AgencyID: principal.AgencyID,
			ID:       clientID,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrClientNotFound
			}
			return nil, fmt.Errorf("get client: %w", err)
		}

		contacts, err := queries.ListClientContactsByClient(ctx, current.ID)
		if err != nil {
			return nil, fmt.Errorf("list client contacts: %w", err)
		}

		merged, primaryContact, changedFields, err := normalizeUpdateInput(current, contacts, input)
		if err != nil {
			return nil, err
		}

		updated, err := queries.UpdateClient(ctx, dbgen.UpdateClientParams{
			AgencyID:           principal.AgencyID,
			ID:                 current.ID,
			Name:               merged.Name,
			Slug:               merged.Slug,
			LeadEmail:          merged.LeadEmail,
			Health:             merged.Health,
			Notes:              merged.Notes,
			MrrCents:           merged.MrrCents,
			OpenApprovalsCount: merged.OpenApprovalsCount,
		})
		if err != nil {
			if isUniqueViolation(err) {
				return nil, ErrClientSlugTaken
			}
			return nil, fmt.Errorf("update client: %w", err)
		}

		if primaryContact != nil {
			if _, err := queries.UpsertPrimaryClientContact(ctx, dbgen.UpsertPrimaryClientContactParams{
				ClientID: updated.ID,
				Name:     primaryContact.Name,
				Email:    primaryContact.Email,
				Role:     primaryContact.Role,
			}); err != nil {
				return nil, fmt.Errorf("upsert primary contact: %w", err)
			}
		}

		if input.TouchpointNote != nil && strings.TrimSpace(*input.TouchpointNote) != "" {
			touchpoint, err := createTouchpoint(ctx, queries, principal, updated.AgencyID, updated.ID, *input.TouchpointNote)
			if err != nil {
				return nil, err
			}
			changedFields = append(changedFields, "touchpoint_note")
			updated.LastTouchpointAt = pgtype.Timestamptz{
				Time:  touchpoint.HappenedAt,
				Valid: true,
			}
		}

		if _, err := activity.NewWriter(tx).Write(ctx, activity.EventInput{
			AgencyID:    principal.AgencyID,
			ActorUserID: &principal.UserID,
			ClientID:    &updated.ID,
			EventType:   "client.updated",
			SubjectType: "client",
			SubjectID:   &updated.ID,
			Message:     fmt.Sprintf("Updated client %s", updated.Name),
			Metadata: map[string]any{
				"changed_fields": changedFields,
			},
		}); err != nil {
			return nil, fmt.Errorf("write activity event: %w", err)
		}

		return loadDetailWithQueries(ctx, queries, updated)
	})
}

func (s *Service) loadDetail(ctx context.Context, clientRecord dbgen.Client) (*Detail, error) {
	return loadDetailWithQueries(ctx, s.queries, clientRecord)
}

func loadDetailWithQueries(ctx context.Context, queries *dbgen.Queries, clientRecord dbgen.Client) (*Detail, error) {
	contacts, err := queries.ListClientContactsByClient(ctx, clientRecord.ID)
	if err != nil {
		return nil, fmt.Errorf("list client contacts: %w", err)
	}

	touchpoints, err := queries.ListClientTouchpointsByClient(ctx, dbgen.ListClientTouchpointsByClientParams{
		ClientID: clientRecord.ID,
		Limit:    10,
	})
	if err != nil {
		return nil, fmt.Errorf("list client touchpoints: %w", err)
	}

	detail := &Detail{
		Summary: mapSummaryFromClient(clientRecord, contacts, touchpoints),
		Contacts: func() []Contact {
			items := make([]Contact, 0, len(contacts))
			for _, contact := range contacts {
				items = append(items, mapContact(contact))
			}
			return items
		}(),
		Touchpoints: func() []Touchpoint {
			items := make([]Touchpoint, 0, len(touchpoints))
			for _, touchpoint := range touchpoints {
				items = append(items, mapTouchpoint(touchpoint))
			}
			return items
		}(),
	}

	return detail, nil
}

func createTouchpoint(ctx context.Context, queries *dbgen.Queries, principal authctx.Principal, agencyID uuid.UUID, clientID uuid.UUID, note string) (*dbgen.ClientTouchpoint, error) {
	note = strings.TrimSpace(note)
	if note == "" {
		return nil, nil
	}

	happenedAt := time.Now().UTC()
	touchpoint, err := queries.CreateClientTouchpoint(ctx, dbgen.CreateClientTouchpointParams{
		ClientID:     clientID,
		AuthorUserID: nullableUUID(principal.UserID),
		Note:         note,
		HappenedAt:   happenedAt,
	})
	if err != nil {
		return nil, fmt.Errorf("create client touchpoint: %w", err)
	}

	if err := queries.SetClientLastTouchpointAt(ctx, dbgen.SetClientLastTouchpointAtParams{
		AgencyID:         agencyID,
		ID:               clientID,
		LastTouchpointAt: pgtype.Timestamptz{Time: happenedAt, Valid: true},
	}); err != nil {
		return nil, fmt.Errorf("set client last touchpoint: %w", err)
	}

	return &touchpoint, nil
}

func mapSummary(row dbgen.ListClientsByAgencyRow) Summary {
	summary := Summary{
		ID:                 row.ID.String(),
		Name:               row.Name,
		Slug:               row.Slug,
		LeadEmail:          row.LeadEmail,
		Health:             row.Health,
		Notes:              row.Notes,
		MrrCents:           row.MrrCents,
		OpenApprovalsCount: row.OpenApprovalsCount,
		LatestTouchpoint:   row.LatestTouchpointNote,
		CreatedAt:          row.CreatedAt,
		UpdatedAt:          row.UpdatedAt,
	}
	if row.LastTouchpointAt.Valid {
		timestamp := row.LastTouchpointAt.Time
		summary.LastTouchpointAt = &timestamp
	}
	if row.PrimaryContactEmail != "" {
		summary.PrimaryContact = &Contact{
			Name:      row.PrimaryContactName,
			Email:     row.PrimaryContactEmail,
			Role:      row.PrimaryContactRole,
			IsPrimary: true,
		}
	}
	return summary
}

func mapSummaryFromClient(clientRecord dbgen.Client, contacts []dbgen.ClientContact, touchpoints []dbgen.ClientTouchpoint) Summary {
	summary := Summary{
		ID:                 clientRecord.ID.String(),
		Name:               clientRecord.Name,
		Slug:               clientRecord.Slug,
		LeadEmail:          clientRecord.LeadEmail,
		Health:             clientRecord.Health,
		Notes:              clientRecord.Notes,
		MrrCents:           clientRecord.MrrCents,
		OpenApprovalsCount: clientRecord.OpenApprovalsCount,
		CreatedAt:          clientRecord.CreatedAt,
		UpdatedAt:          clientRecord.UpdatedAt,
	}
	if clientRecord.LastTouchpointAt.Valid {
		timestamp := clientRecord.LastTouchpointAt.Time
		summary.LastTouchpointAt = &timestamp
	}
	for _, contact := range contacts {
		if contact.IsPrimary {
			mapped := mapContact(contact)
			summary.PrimaryContact = &mapped
			break
		}
	}
	if len(touchpoints) > 0 {
		summary.LatestTouchpoint = touchpoints[0].Note
	}
	return summary
}

func mapContact(contact dbgen.ClientContact) Contact {
	return Contact{
		ID:        contact.ID.String(),
		Name:      contact.Name,
		Email:     contact.Email,
		Role:      contact.Role,
		IsPrimary: contact.IsPrimary,
		CreatedAt: contact.CreatedAt,
		UpdatedAt: contact.UpdatedAt,
	}
}

func mapTouchpoint(touchpoint dbgen.ClientTouchpoint) Touchpoint {
	item := Touchpoint{
		ID:         touchpoint.ID.String(),
		Note:       touchpoint.Note,
		HappenedAt: touchpoint.HappenedAt,
		CreatedAt:  touchpoint.CreatedAt,
	}
	if touchpoint.AuthorUserID.Valid {
		authorID := uuid.UUID(touchpoint.AuthorUserID.Bytes).String()
		item.AuthorUserID = &authorID
	}
	return item
}

type normalizedCreateInput struct {
	Name               string
	Slug               string
	LeadEmail          string
	Health             string
	Notes              string
	MrrCents           int64
	OpenApprovalsCount int32
	PrimaryContact     ContactInput
	InitialTouchpoint  string
}

func normalizeCreateInput(input CreateInput) (normalizedCreateInput, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return normalizedCreateInput{}, fmt.Errorf("%w: name is required", ErrValidation)
	}

	leadEmail := normalizeEmail(input.LeadEmail)
	primaryContact, err := normalizePrimaryContact(name, leadEmail, input.PrimaryContact, nil)
	if err != nil {
		return normalizedCreateInput{}, err
	}

	health, err := normalizeHealth(input.Health, "strong")
	if err != nil {
		return normalizedCreateInput{}, err
	}

	slug := normalizeSlug(input.Slug, name)

	return normalizedCreateInput{
		Name:               name,
		Slug:               slug,
		LeadEmail:          primaryContact.Email,
		Health:             health,
		Notes:              strings.TrimSpace(input.Notes),
		MrrCents:           input.MrrCents,
		OpenApprovalsCount: input.OpenApprovalsCount,
		PrimaryContact:     primaryContact,
		InitialTouchpoint:  strings.TrimSpace(input.InitialTouchpoint),
	}, nil
}

func normalizeUpdateInput(current dbgen.Client, contacts []dbgen.ClientContact, input UpdateInput) (dbgen.Client, *ContactInput, []string, error) {
	updated := current
	changedFields := []string{}

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return dbgen.Client{}, nil, nil, fmt.Errorf("%w: name cannot be empty", ErrValidation)
		}
		updated.Name = name
		changedFields = append(changedFields, "name")
	}

	if input.Slug != nil {
		if strings.TrimSpace(*input.Slug) == "" {
			return dbgen.Client{}, nil, nil, fmt.Errorf("%w: slug cannot be empty", ErrValidation)
		}
		slug := normalizeSlug(*input.Slug, updated.Name)
		if slug == "" {
			return dbgen.Client{}, nil, nil, fmt.Errorf("%w: slug cannot be empty", ErrValidation)
		}
		updated.Slug = slug
		changedFields = append(changedFields, "slug")
	}

	if input.LeadEmail != nil {
		leadEmail := normalizeEmail(*input.LeadEmail)
		if leadEmail == "" {
			return dbgen.Client{}, nil, nil, fmt.Errorf("%w: lead_email cannot be empty", ErrValidation)
		}
		updated.LeadEmail = leadEmail
		changedFields = append(changedFields, "lead_email")
	}

	if input.Health != nil {
		health, err := normalizeHealth(*input.Health, updated.Health)
		if err != nil {
			return dbgen.Client{}, nil, nil, err
		}
		updated.Health = health
		changedFields = append(changedFields, "health")
	}

	if input.Notes != nil {
		updated.Notes = strings.TrimSpace(*input.Notes)
		changedFields = append(changedFields, "notes")
	}

	if input.MrrCents != nil {
		if *input.MrrCents < 0 {
			return dbgen.Client{}, nil, nil, fmt.Errorf("%w: mrr_cents must be zero or greater", ErrValidation)
		}
		updated.MrrCents = *input.MrrCents
		changedFields = append(changedFields, "mrr_cents")
	}

	if input.OpenApprovalsCount != nil {
		if *input.OpenApprovalsCount < 0 {
			return dbgen.Client{}, nil, nil, fmt.Errorf("%w: open_approvals_count must be zero or greater", ErrValidation)
		}
		updated.OpenApprovalsCount = *input.OpenApprovalsCount
		changedFields = append(changedFields, "open_approvals_count")
	}

	var primaryContact *ContactInput
	if input.PrimaryContact != nil || input.LeadEmail != nil {
		normalized, err := normalizePrimaryContact(updated.Name, updated.LeadEmail, input.PrimaryContact, contacts)
		if err != nil {
			return dbgen.Client{}, nil, nil, err
		}
		primaryContact = &normalized
		updated.LeadEmail = normalized.Email
		changedFields = append(changedFields, "primary_contact")
	}

	return updated, primaryContact, changedFields, nil
}

func normalizePrimaryContact(clientName string, leadEmail string, input *ContactInput, existing []dbgen.ClientContact) (ContactInput, error) {
	contact := ContactInput{}

	if input != nil {
		contact.Name = strings.TrimSpace(input.Name)
		contact.Email = normalizeEmail(input.Email)
		contact.Role = strings.TrimSpace(input.Role)
	}

	if contact.Email == "" {
		contact.Email = normalizeEmail(leadEmail)
	}
	if contact.Email == "" {
		for _, existingContact := range existing {
			if existingContact.IsPrimary {
				contact.Email = existingContact.Email
				if contact.Name == "" {
					contact.Name = existingContact.Name
				}
				if contact.Role == "" {
					contact.Role = existingContact.Role
				}
				break
			}
		}
	}
	if contact.Email == "" {
		return ContactInput{}, fmt.Errorf("%w: lead_email is required", ErrValidation)
	}

	if contact.Name == "" {
		for _, existingContact := range existing {
			if existingContact.IsPrimary && existingContact.Name != "" {
				contact.Name = existingContact.Name
				break
			}
		}
	}
	if contact.Name == "" {
		contact.Name = clientName + " Primary Contact"
	}
	if contact.Role == "" {
		for _, existingContact := range existing {
			if existingContact.IsPrimary && existingContact.Role != "" {
				contact.Role = existingContact.Role
				break
			}
		}
	}
	if contact.Role == "" {
		contact.Role = "lead"
	}

	return contact, nil
}

func normalizeHealth(raw string, fallback string) (string, error) {
	value := strings.TrimSpace(strings.ToLower(raw))
	if value == "" {
		value = fallback
	}

	switch value {
	case "strong", "watch", "risk":
		return value, nil
	default:
		return "", fmt.Errorf("%w: health must be one of strong, watch, risk", ErrValidation)
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

var slugPattern = regexp.MustCompile(`[^a-z0-9]+`)

func normalizeSlug(raw string, fallback string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		value = fallback
	}
	value = strings.ToLower(value)
	value = slugPattern.ReplaceAllString(value, "-")
	return strings.Trim(value, "-")
}

func nullableUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: id,
		Valid: true,
	}
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
