package activity

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/nyashahama/AgencyForge/backend/db/gen"
)

type Writer struct {
	queries *dbgen.Queries
}

type EventInput struct {
	AgencyID    uuid.UUID
	ActorUserID *uuid.UUID
	ClientID    *uuid.UUID
	BriefID     *uuid.UUID
	CampaignID  *uuid.UUID
	PortalID    *uuid.UUID
	EventType   string
	SubjectType string
	SubjectID   *uuid.UUID
	Message     string
	Metadata    map[string]any
	OccurredAt  time.Time
}

func NewWriter(db dbgen.DBTX) *Writer {
	return &Writer{
		queries: dbgen.New(db),
	}
}

func (w *Writer) Write(ctx context.Context, input EventInput) (*dbgen.ActivityEvent, error) {
	if input.AgencyID == uuid.Nil {
		return nil, fmt.Errorf("agency_id is required")
	}
	if input.EventType == "" {
		return nil, fmt.Errorf("event_type is required")
	}
	if input.Message == "" {
		return nil, fmt.Errorf("message is required")
	}

	metadata, err := json.Marshal(input.Metadata)
	if err != nil {
		return nil, fmt.Errorf("marshal activity metadata: %w", err)
	}

	occurredAt := input.OccurredAt
	if occurredAt.IsZero() {
		occurredAt = time.Now().UTC()
	}

	event, err := w.queries.CreateActivityEvent(ctx, dbgen.CreateActivityEventParams{
		AgencyID:    input.AgencyID,
		ActorUserID: nullableUUID(input.ActorUserID),
		ClientID:    nullableUUID(input.ClientID),
		BriefID:     nullableUUID(input.BriefID),
		CampaignID:  nullableUUID(input.CampaignID),
		PortalID:    nullableUUID(input.PortalID),
		EventType:   input.EventType,
		SubjectType: input.SubjectType,
		SubjectID:   nullableUUID(input.SubjectID),
		Message:     input.Message,
		Metadata:    metadata,
		OccurredAt:  occurredAt,
	})
	if err != nil {
		return nil, fmt.Errorf("create activity event: %w", err)
	}

	return &event, nil
}

func nullableUUID(id *uuid.UUID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}

	return pgtype.UUID{
		Bytes: *id,
		Valid: true,
	}
}
