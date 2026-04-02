//go:build integration

package integration

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/analytics"
	"github.com/nyashahama/AgencyForge/backend/internal/auth"
	"github.com/nyashahama/AgencyForge/backend/internal/brief"
	"github.com/nyashahama/AgencyForge/backend/internal/campaign"
	"github.com/nyashahama/AgencyForge/backend/internal/client"
	"github.com/nyashahama/AgencyForge/backend/internal/config"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/health"
	"github.com/nyashahama/AgencyForge/backend/internal/portal"
	"github.com/nyashahama/AgencyForge/backend/internal/server"
	"github.com/nyashahama/AgencyForge/backend/internal/workspace"
)

func TestAnalyticsDashboard_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newAnalyticsTestRouter(t)
	token := registerTestUser(t, router, "Nova Reed")
	principal := currentTestUser(t, router, token)

	seedAnalyticsFixtures(t, principal.AgencyID, principal.ID)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/dashboard?days=7&activity_limit=5", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("dashboard status = %d, want %d, body = %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var payload struct {
		Data struct {
			Overview struct {
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
			} `json:"overview"`
			Throughput []struct {
				DayLabel  string `json:"day_label"`
				Campaigns int    `json:"campaigns"`
			} `json:"throughput"`
			Specialists []struct {
				Code               string `json:"code"`
				Status             string `json:"status"`
				Load               int    `json:"load"`
				BlockedAssignments int    `json:"blocked_assignments"`
			} `json:"specialists"`
			RecentActivity []struct {
				EventType string `json:"event_type"`
				Message   string `json:"message"`
			} `json:"recent_activity"`
			CampaignStatuses []struct {
				Status string `json:"status"`
				Count  int    `json:"count"`
			} `json:"campaign_statuses"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	overview := payload.Data.Overview
	if overview.LiveCampaigns != 2 || overview.ReviewsDue != 1 {
		t.Fatalf("unexpected campaign overview: %+v", overview)
	}
	if overview.BriefsProcessed != 1 || overview.ActiveClients != 1 {
		t.Fatalf("unexpected intake overview: %+v", overview)
	}
	if overview.ActiveSpecialists != 3 || overview.PendingApprovals != 1 || overview.WeeklyOutput != 1 {
		t.Fatalf("unexpected delivery overview: %+v", overview)
	}
	if overview.AvgCompletionPercent != 79 {
		t.Fatalf("avg completion = %d, want 79", overview.AvgCompletionPercent)
	}
	if overview.ApprovalRate != 50 {
		t.Fatalf("approval rate = %.1f, want 50.0", overview.ApprovalRate)
	}
	if overview.ApprovalLatencyDays != 1 {
		t.Fatalf("approval latency = %.1f, want 1.0", overview.ApprovalLatencyDays)
	}
	if overview.AvgTurnaroundDays != 2 {
		t.Fatalf("turnaround = %.1f, want 2.0", overview.AvgTurnaroundDays)
	}

	if len(payload.Data.Throughput) != 7 {
		t.Fatalf("throughput points = %d, want 7", len(payload.Data.Throughput))
	}
	nonZeroDays := 0
	for _, point := range payload.Data.Throughput {
		if point.Campaigns > 0 {
			nonZeroDays++
		}
	}
	if nonZeroDays != 1 {
		t.Fatalf("non-zero throughput days = %d, want 1", nonZeroDays)
	}

	if len(payload.Data.Specialists) != 6 {
		t.Fatalf("specialist count = %d, want 6", len(payload.Data.Specialists))
	}
	if payload.Data.Specialists[0].Code != "copy" || payload.Data.Specialists[0].Status != "active" {
		t.Fatalf("unexpected first specialist row: %+v", payload.Data.Specialists[0])
	}

	if len(payload.Data.RecentActivity) != 3 {
		t.Fatalf("recent activity count = %d, want 3", len(payload.Data.RecentActivity))
	}
	if payload.Data.RecentActivity[0].EventType != "campaign.approved" {
		t.Fatalf("latest activity event = %q, want campaign.approved", payload.Data.RecentActivity[0].EventType)
	}

	statusCounts := make(map[string]int, len(payload.Data.CampaignStatuses))
	for _, item := range payload.Data.CampaignStatuses {
		statusCounts[item.Status] = item.Count
	}
	if statusCounts["approved"] != 1 || statusCounts["review"] != 1 || statusCounts["generating"] != 1 {
		t.Fatalf("unexpected campaign statuses: %+v", statusCounts)
	}

	throughputReq := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/throughput?days=7", nil)
	throughputReq.Header.Set("Authorization", "Bearer "+token)
	throughputRec := httptest.NewRecorder()
	router.ServeHTTP(throughputRec, throughputReq)

	if throughputRec.Code != http.StatusOK {
		t.Fatalf("throughput status = %d, want %d, body = %s", throughputRec.Code, http.StatusOK, throughputRec.Body.String())
	}

	var throughputPayload struct {
		Data []struct {
			Campaigns int `json:"campaigns"`
		} `json:"data"`
		Meta struct {
			Total int `json:"total"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(throughputRec.Body).Decode(&throughputPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if throughputPayload.Meta.Total != 7 || len(throughputPayload.Data) != 7 {
		t.Fatalf("throughput total=%d len=%d, want 7", throughputPayload.Meta.Total, len(throughputPayload.Data))
	}

	specialistsReq := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/specialists", nil)
	specialistsReq.Header.Set("Authorization", "Bearer "+token)
	specialistsRec := httptest.NewRecorder()
	router.ServeHTTP(specialistsRec, specialistsReq)

	if specialistsRec.Code != http.StatusOK {
		t.Fatalf("specialists status = %d, want %d, body = %s", specialistsRec.Code, http.StatusOK, specialistsRec.Body.String())
	}

	var specialistsPayload struct {
		Data []struct {
			Code   string `json:"code"`
			Status string `json:"status"`
			Load   int    `json:"load"`
		} `json:"data"`
	}
	if err := json.NewDecoder(specialistsRec.Body).Decode(&specialistsPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if len(specialistsPayload.Data) != 6 {
		t.Fatalf("specialists endpoint len = %d, want 6", len(specialistsPayload.Data))
	}
}

func TestAnalyticsDataIsAgencyScoped_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newAnalyticsTestRouter(t)
	tokenA := registerTestUser(t, router, "Ariel Stone")
	tokenB := registerTestUser(t, router, "Mika Rowe")

	principalA := currentTestUser(t, router, tokenA)
	seedAnalyticsFixtures(t, principalA.AgencyID, principalA.ID)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/dashboard?days=7", nil)
	req.Header.Set("Authorization", "Bearer "+tokenB)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("dashboard status = %d, want %d, body = %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var payload struct {
		Data struct {
			Overview struct {
				LiveCampaigns     int `json:"live_campaigns"`
				ReviewsDue        int `json:"reviews_due"`
				BriefsProcessed   int `json:"briefs_processed"`
				ActiveClients     int `json:"active_clients"`
				ActiveSpecialists int `json:"active_specialists"`
				WeeklyOutput      int `json:"weekly_output"`
			} `json:"overview"`
			RecentActivity []any `json:"recent_activity"`
			Throughput     []struct {
				Campaigns int `json:"campaigns"`
			} `json:"throughput"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if payload.Data.Overview.LiveCampaigns != 0 ||
		payload.Data.Overview.ReviewsDue != 0 ||
		payload.Data.Overview.BriefsProcessed != 0 ||
		payload.Data.Overview.ActiveClients != 0 ||
		payload.Data.Overview.ActiveSpecialists != 0 ||
		payload.Data.Overview.WeeklyOutput != 0 {
		t.Fatalf("unexpected scoped overview: %+v", payload.Data.Overview)
	}
	if len(payload.Data.RecentActivity) != 0 {
		t.Fatalf("recent activity len = %d, want 0", len(payload.Data.RecentActivity))
	}
	for _, point := range payload.Data.Throughput {
		if point.Campaigns != 0 {
			t.Fatalf("throughput campaign count = %d, want 0", point.Campaigns)
		}
	}
}

func newAnalyticsTestRouter(t *testing.T) http.Handler {
	t.Helper()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable"
	}

	t.Setenv("DATABASE_URL", dbURL)
	t.Setenv("JWT_SECRET", strings.Repeat("a", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("config.Load() error = %v", err)
	}

	db := &database.Pool{Pool: testDB}
	return server.NewRouter(cfg, slog.New(slog.NewTextHandler(os.Stdout, nil)), server.Handlers{
		Health:    health.New(testDB),
		Auth:      auth.NewHandler(auth.NewService(db, cfg.JWTSecret, 15*time.Minute, 168*time.Hour)),
		Analytics: analytics.NewHandler(analytics.NewService(db)),
		Clients:   client.NewHandler(client.NewService(db)),
		Briefs:    brief.NewHandler(brief.NewService(db)),
		Campaigns: campaign.NewHandler(campaign.NewService(db)),
		Portals:   portal.NewHandler(portal.NewService(db)),
		Workspace: workspace.NewHandler(workspace.NewService(db)),
	})
}

type authUser struct {
	ID       uuid.UUID
	AgencyID uuid.UUID
}

func currentTestUser(t *testing.T, router http.Handler, token string) authUser {
	t.Helper()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("me status = %d, want %d, body = %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var payload struct {
		Data struct {
			ID       string `json:"id"`
			AgencyID string `json:"agency_id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	userID, err := uuid.Parse(payload.Data.ID)
	if err != nil {
		t.Fatalf("parse user id: %v", err)
	}
	agencyID, err := uuid.Parse(payload.Data.AgencyID)
	if err != nil {
		t.Fatalf("parse agency id: %v", err)
	}

	return authUser{
		ID:       userID,
		AgencyID: agencyID,
	}
}

func seedAnalyticsFixtures(t *testing.T, agencyID uuid.UUID, userID uuid.UUID) {
	t.Helper()

	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)

	clientID := uuid.New()
	briefID := uuid.New()
	campaignApprovedID := uuid.New()
	campaignReviewID := uuid.New()
	campaignGeneratingID := uuid.New()

	copyID := specialistIDByCode(t, "copy")
	designID := specialistIDByCode(t, "design")
	portalID := specialistIDByCode(t, "portal")

	if _, err := testDB.Exec(ctx, `
		INSERT INTO clients (
			id, agency_id, owner_user_id, name, slug, lead_email, health, notes, mrr_cents,
			open_approvals_count, last_touchpoint_at, created_at, updated_at
		) VALUES ($1, $2, $3, 'Atlas Foods', 'atlas-foods', 'atlas@client.test', 'strong', '', 450000, 1, $4, $5, $5)
	`, clientID, agencyID, userID, now.Add(-6*time.Hour), now.Add(-7*24*time.Hour)); err != nil {
		t.Fatalf("insert client: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO briefs (
			id, agency_id, client_id, created_by_user_id, title, channel, status, source_type,
			next_action, pages, owner_email, launched_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, 'Spring launch', 'paid-social', 'launched', 'manual', 'Awaiting approvals', 12, 'nova@agencyforge.test', $5, $6, $6)
	`, briefID, agencyID, clientID, userID, now.Add(-48*time.Hour), now.Add(-72*time.Hour)); err != nil {
		t.Fatalf("insert brief: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO brief_status_history (
			id, brief_id, from_status, to_status, changed_by_user_id, note, created_at
		) VALUES
			($1, $2, NULL, 'new', $3, 'Brief created', $4),
			($5, $2, 'new', 'launched', $3, 'Brief launched', $6)
	`, uuid.New(), briefID, userID, now.Add(-72*time.Hour), uuid.New(), now.Add(-48*time.Hour)); err != nil {
		t.Fatalf("insert brief history: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO campaigns (
			id, agency_id, owner_user_id, client_id, brief_id, name, status, budget_cents, due_at,
			progress_percent, risk_level, budget_currency, deliverable_count, approved_at, created_at, updated_at
		) VALUES
			($1, $2, $3, $4, $5, 'Atlas Approved', 'approved', 1250000, $6, 100, 'low', 'USD', 2, $7, $8, $8),
			($9, $2, $3, $4, NULL, 'Atlas Review', 'review', 980000, $10, 92, 'medium', 'USD', 1, NULL, $11, $11),
			($12, $2, $3, $4, NULL, 'Atlas Generating', 'generating', 760000, $13, 45, 'high', 'USD', 1, NULL, $14, $14)
	`, campaignApprovedID, agencyID, userID, clientID, briefID,
		now.Add(2*24*time.Hour), now.Add(-24*time.Hour), now.Add(-72*time.Hour),
		campaignReviewID, now.Add(24*time.Hour), now.Add(-36*time.Hour),
		campaignGeneratingID, now.Add(3*24*time.Hour), now.Add(-18*time.Hour)); err != nil {
		t.Fatalf("insert campaigns: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO campaign_status_history (
			id, campaign_id, from_status, to_status, changed_by_user_id, note, created_at
		) VALUES
			($1, $2, NULL, 'draft', $3, 'Campaign created', $4),
			($5, $2, 'draft', 'approved', $3, 'Campaign approved', $6),
			($7, $8, NULL, 'review', $3, 'Review requested', $9),
			($10, $11, NULL, 'generating', $3, 'Generation started', $12)
	`, uuid.New(), campaignApprovedID, userID, now.Add(-72*time.Hour),
		uuid.New(), now.Add(-24*time.Hour),
		uuid.New(), campaignReviewID, now.Add(-36*time.Hour),
		uuid.New(), campaignGeneratingID, now.Add(-18*time.Hour)); err != nil {
		t.Fatalf("insert campaign history: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO campaign_assignments (
			id, campaign_id, specialist_id, assigned_user_id, status, load_units, created_at, updated_at
		) VALUES
			($1, $2, $3, $4, 'active', 4, $5, $5),
			($6, $7, $8, $4, 'blocked', 3, $9, $9),
			($10, $2, $11, $4, 'queued', 2, $5, $5)
	`, uuid.New(), campaignReviewID, copyID, userID, now.Add(-12*time.Hour),
		uuid.New(), campaignGeneratingID, designID, now.Add(-10*time.Hour),
		uuid.New(), portalID); err != nil {
		t.Fatalf("insert assignments: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO campaign_approvals (
			id, campaign_id, approver_name, approver_email, status, feedback,
			requested_at, responded_at, created_at, updated_at
		) VALUES
			($1, $2, 'Maya Atlas', 'maya@atlas.test', 'approved', 'Looks strong', $3, $4, $3, $4),
			($5, $6, 'Theo Atlas', 'theo@atlas.test', 'pending', '', $7, NULL, $7, $7)
	`, uuid.New(), campaignApprovedID, now.Add(-48*time.Hour), now.Add(-24*time.Hour),
		uuid.New(), campaignReviewID, now.Add(-6*time.Hour)); err != nil {
		t.Fatalf("insert approvals: %v", err)
	}

	if _, err := testDB.Exec(ctx, `
		INSERT INTO activity_events (
			id, agency_id, actor_user_id, client_id, brief_id, campaign_id, event_type,
			subject_type, subject_id, message, metadata, occurred_at, created_at
		) VALUES
			($1, $2, $3, $4, $5, $6, 'campaign.approved', 'campaign', $6, 'Campaign approved for Atlas Foods', '{"status":"approved"}'::jsonb, $7, $7),
			($8, $2, $3, $4, NULL, $9, 'campaign.updated', 'campaign', $9, 'Updated review package for Atlas Foods', '{"status":"review"}'::jsonb, $10, $10),
			($11, $2, $3, $4, $5, NULL, 'brief.launched', 'brief', $5, 'Launched brief Spring launch', '{"status":"launched"}'::jsonb, $12, $12)
	`, uuid.New(), agencyID, userID, clientID, briefID, campaignApprovedID, now.Add(-30*time.Minute),
		uuid.New(), campaignReviewID, now.Add(-2*time.Hour),
		uuid.New(), now.Add(-26*time.Hour)); err != nil {
		t.Fatalf("insert activity events: %v", err)
	}
}

func specialistIDByCode(t *testing.T, code string) uuid.UUID {
	t.Helper()

	var id uuid.UUID
	if err := testDB.QueryRow(context.Background(), `SELECT id FROM specialists WHERE code = $1 LIMIT 1`, code).Scan(&id); err != nil {
		t.Fatalf("lookup specialist %s: %v", code, err)
	}
	return id
}
