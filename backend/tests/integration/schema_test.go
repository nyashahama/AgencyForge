//go:build integration

package integration

import (
	"context"
	"testing"
)

func TestExpectedTablesExist_Integration(t *testing.T) {
	tables := []string{
		"agencies",
		"agency_memberships",
		"users",
		"refresh_tokens",
		"clients",
		"client_contacts",
		"client_touchpoints",
		"briefs",
		"brief_documents",
		"brief_status_history",
		"campaigns",
		"specialists",
		"campaign_assignments",
		"campaign_status_history",
		"campaign_deliverables",
		"campaign_approvals",
		"portals",
		"portal_review_flows",
		"portal_publications",
		"portal_shares",
		"playbooks",
		"setting_groups",
		"setting_items",
		"activity_events",
	}

	ctx := context.Background()

	for _, table := range tables {
		var exists bool
		err := testDB.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = 'public'
				  AND table_name = $1
			)
		`, table).Scan(&exists)
		if err != nil {
			t.Fatalf("table lookup for %s failed: %v", table, err)
		}
		if !exists {
			t.Fatalf("expected table %s to exist", table)
		}
	}
}
