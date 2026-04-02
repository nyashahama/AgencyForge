//go:build integration

package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/activity"
)

func TestActivityWriter_Integration(t *testing.T) {
	agencyID := uuid.New()
	slug := fmt.Sprintf("activity-%d", time.Now().UTC().UnixNano())

	if _, err := testDB.Exec(context.Background(), `
		INSERT INTO agencies (id, name, slug)
		VALUES ($1, $2, $3)
	`, agencyID, "Activity Agency", slug); err != nil {
		t.Fatalf("insert agency: %v", err)
	}

	writer := activity.NewWriter(testDB)
	event, err := writer.Write(context.Background(), activity.EventInput{
		AgencyID:    agencyID,
		EventType:   "client.created",
		SubjectType: "client",
		Message:     "Created Meridian client account",
		Metadata: map[string]any{
			"source": "integration-test",
		},
	})
	if err != nil {
		t.Fatalf("Write() error = %v", err)
	}

	if event.EventType != "client.created" {
		t.Fatalf("EventType = %q, want client.created", event.EventType)
	}

	var metadata map[string]any
	if err := json.Unmarshal(event.Metadata, &metadata); err != nil {
		t.Fatalf("Unmarshal() error = %v", err)
	}

	if metadata["source"] != "integration-test" {
		t.Fatalf("metadata[source] = %v, want integration-test", metadata["source"])
	}
}
