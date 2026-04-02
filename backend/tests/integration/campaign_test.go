//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/nyashahama/AgencyForge/backend/internal/auth"
	"github.com/nyashahama/AgencyForge/backend/internal/brief"
	"github.com/nyashahama/AgencyForge/backend/internal/campaign"
	"github.com/nyashahama/AgencyForge/backend/internal/client"
	"github.com/nyashahama/AgencyForge/backend/internal/config"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/health"
	"github.com/nyashahama/AgencyForge/backend/internal/portal"
	"github.com/nyashahama/AgencyForge/backend/internal/server"
)

func TestCampaignsCreateListGetUpdateAdvance_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newCampaignTestRouter(t)
	token := registerTestUser(t, router, "Sophia Lund")
	clientID := createClientForToken(t, router, token, "Meridian Bank", "nia@meridian.test")
	briefID := createBriefForToken(t, router, token, clientID, "Retail credit expansion")

	createBody := bytes.NewBufferString(`{
		"client_id":"` + clientID + `",
		"brief_id":"` + briefID + `",
		"name":"Q3 Retail Credit Refresh",
		"status":"generating",
		"budget_cents":18000000,
		"due_at":"2026-04-15T12:00:00Z",
		"risk_level":"medium",
		"assignments":[
			{"specialist_code":"copy","status":"active","load_units":2},
			{"specialist_code":"design","status":"queued","load_units":1}
		],
		"deliverables":[
			{"name":"Copy suite","deliverable_type":"copy","status":"review","file_url":"https://cdn.test/copy-suite-v1"}
		],
		"approvals":[
			{"approver_name":"Nia Cole","approver_email":"nia@meridian.test","status":"pending"}
		]
	}`)
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/campaigns", createBody)
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID               string `json:"id"`
			Status           string `json:"status"`
			BriefID          string `json:"brief_id"`
			DeliverableCount int32  `json:"deliverable_count"`
			Assignments      []struct {
				SpecialistCode string `json:"specialist_code"`
				Status         string `json:"status"`
			} `json:"assignments"`
			Deliverables []struct {
				ID     string `json:"id"`
				Name   string `json:"name"`
				Status string `json:"status"`
			} `json:"deliverables"`
			Approvals []struct {
				ID     string `json:"id"`
				Status string `json:"status"`
			} `json:"approvals"`
			History []any `json:"history"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if created.Data.Status != "generating" {
		t.Fatalf("status = %q, want generating", created.Data.Status)
	}
	if created.Data.BriefID != briefID {
		t.Fatalf("brief_id = %q, want %s", created.Data.BriefID, briefID)
	}
	if len(created.Data.Assignments) != 2 || len(created.Data.Deliverables) != 1 || len(created.Data.Approvals) != 1 {
		t.Fatalf("assignments=%d deliverables=%d approvals=%d, want 2/1/1", len(created.Data.Assignments), len(created.Data.Deliverables), len(created.Data.Approvals))
	}
	if len(created.Data.History) != 1 {
		t.Fatalf("history = %d, want 1", len(created.Data.History))
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/campaigns?page=1&per_page=10", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}

	var listed struct {
		Data []struct {
			ID                    string   `json:"id"`
			ClientName            string   `json:"client_name"`
			Specialists           []string `json:"specialists"`
			PendingApprovalsCount int64    `json:"pending_approvals_count"`
		} `json:"data"`
		Meta struct {
			Total int `json:"total"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(listRec.Body).Decode(&listed); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if listed.Meta.Total != 1 || len(listed.Data) != 1 {
		t.Fatalf("total=%d len=%d, want 1", listed.Meta.Total, len(listed.Data))
	}
	if listed.Data[0].ClientName != "Meridian Bank" || listed.Data[0].PendingApprovalsCount != 1 {
		t.Fatalf("unexpected list payload: %+v", listed.Data[0])
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/campaigns/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("get status = %d, want %d, body = %s", getRec.Code, http.StatusOK, getRec.Body.String())
	}

	updateBody := bytes.NewBufferString(`{
		"status":"review",
		"progress":90,
		"risk_level":"high",
		"assignments":[
			{"specialist_code":"copy","status":"complete","load_units":2},
			{"specialist_code":"legal","status":"blocked","load_units":1}
		],
		"deliverables":[
			{"id":"` + created.Data.Deliverables[0].ID + `","name":"Copy suite v2","deliverable_type":"copy","status":"approved","file_url":"https://cdn.test/copy-suite-v2"},
			{"name":"Legal memo","deliverable_type":"legal","status":"review","file_url":"https://cdn.test/legal-memo"}
		],
		"approvals":[
			{"id":"` + created.Data.Approvals[0].ID + `","approver_name":"Nia Cole","approver_email":"nia@meridian.test","status":"approved","feedback":"Looks good"},
			{"approver_name":"Theo Marsh","approver_email":"theo@meridian.test","status":"pending"}
		]
	}`)
	updateReq := httptest.NewRequest(http.MethodPatch, "/api/v1/campaigns/"+created.Data.ID, updateBody)
	updateReq.Header.Set("Authorization", "Bearer "+token)
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("update status = %d, want %d, body = %s", updateRec.Code, http.StatusOK, updateRec.Body.String())
	}

	var updated struct {
		Data struct {
			Status                string `json:"status"`
			Progress              int32  `json:"progress"`
			RiskLevel             string `json:"risk_level"`
			DeliverableCount      int32  `json:"deliverable_count"`
			PendingApprovalsCount int64  `json:"pending_approvals_count"`
			Assignments           []struct {
				SpecialistCode string `json:"specialist_code"`
			} `json:"assignments"`
			Deliverables []struct {
				Name string `json:"name"`
			} `json:"deliverables"`
			Approvals []struct {
				Status string `json:"status"`
			} `json:"approvals"`
			History []any `json:"history"`
		} `json:"data"`
	}
	if err := json.NewDecoder(updateRec.Body).Decode(&updated); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if updated.Data.Status != "review" || updated.Data.Progress != 90 || updated.Data.RiskLevel != "high" {
		t.Fatalf("unexpected updated state: %+v", updated.Data)
	}
	if updated.Data.DeliverableCount != 2 || updated.Data.PendingApprovalsCount != 1 {
		t.Fatalf("deliverable_count/pending_approvals = %d/%d, want 2/1", updated.Data.DeliverableCount, updated.Data.PendingApprovalsCount)
	}
	if len(updated.Data.Assignments) != 2 || len(updated.Data.Deliverables) != 2 || len(updated.Data.Approvals) != 2 {
		t.Fatalf("assignments=%d deliverables=%d approvals=%d, want 2 each", len(updated.Data.Assignments), len(updated.Data.Deliverables), len(updated.Data.Approvals))
	}
	if len(updated.Data.History) != 2 {
		t.Fatalf("history = %d, want 2", len(updated.Data.History))
	}

	var openApprovals int32
	if err := testDB.QueryRow(context.Background(), `SELECT open_approvals_count FROM clients WHERE id = $1`, clientID).Scan(&openApprovals); err != nil {
		t.Fatalf("query open approvals: %v", err)
	}
	if openApprovals != 1 {
		t.Fatalf("open_approvals_count = %d, want 1", openApprovals)
	}

	advanceReq := httptest.NewRequest(http.MethodPost, "/api/v1/campaigns/"+created.Data.ID+"/advance", bytes.NewBufferString(`{"note":"Moved to final approval"}`))
	advanceReq.Header.Set("Authorization", "Bearer "+token)
	advanceRec := httptest.NewRecorder()
	router.ServeHTTP(advanceRec, advanceReq)

	if advanceRec.Code != http.StatusOK {
		t.Fatalf("advance status = %d, want %d, body = %s", advanceRec.Code, http.StatusOK, advanceRec.Body.String())
	}

	var advanced struct {
		Data struct {
			Status   string `json:"status"`
			Progress int32  `json:"progress"`
			History  []any  `json:"history"`
		} `json:"data"`
	}
	if err := json.NewDecoder(advanceRec.Body).Decode(&advanced); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if advanced.Data.Status != "approved" || advanced.Data.Progress != 100 {
		t.Fatalf("advanced state = %+v, want approved/100", advanced.Data)
	}
	if len(advanced.Data.History) != 3 {
		t.Fatalf("history = %d, want 3", len(advanced.Data.History))
	}

	reAdvanceReq := httptest.NewRequest(http.MethodPost, "/api/v1/campaigns/"+created.Data.ID+"/advance", bytes.NewBufferString(`{}`))
	reAdvanceReq.Header.Set("Authorization", "Bearer "+token)
	reAdvanceRec := httptest.NewRecorder()
	router.ServeHTTP(reAdvanceRec, reAdvanceReq)

	if reAdvanceRec.Code != http.StatusConflict {
		t.Fatalf("re-advance status = %d, want %d, body = %s", reAdvanceRec.Code, http.StatusConflict, reAdvanceRec.Body.String())
	}
}

func TestCampaignsAreAgencyScoped_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newCampaignTestRouter(t)
	tokenA := registerTestUser(t, router, "Ava Grant")
	tokenB := registerTestUser(t, router, "Marcus Reid")
	clientID := createClientForToken(t, router, tokenA, "Volta Footwear", "hello@volta.test")

	createBody := bytes.NewBufferString(`{
		"client_id":"` + clientID + `",
		"name":"Summer Launch 2026"
	}`)
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/campaigns", createBody)
	createReq.Header.Set("Authorization", "Bearer "+tokenA)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/campaigns/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+tokenB)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusNotFound {
		t.Fatalf("cross-agency get status = %d, want %d, body = %s", getRec.Code, http.StatusNotFound, getRec.Body.String())
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/campaigns", nil)
	listReq.Header.Set("Authorization", "Bearer "+tokenB)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("cross-agency list status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}

	var listed struct {
		Data []any `json:"data"`
		Meta struct {
			Total int `json:"total"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(listRec.Body).Decode(&listed); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if listed.Meta.Total != 0 || len(listed.Data) != 0 {
		t.Fatalf("cross-agency list total=%d len=%d, want 0", listed.Meta.Total, len(listed.Data))
	}
}

func newCampaignTestRouter(t *testing.T) http.Handler {
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
		Clients:   client.NewHandler(client.NewService(db)),
		Briefs:    brief.NewHandler(brief.NewService(db)),
		Campaigns: campaign.NewHandler(campaign.NewService(db)),
		Portals:   portal.NewHandler(portal.NewService(nil)),
	})
}

func createBriefForToken(t *testing.T, router http.Handler, token string, clientID string, title string) string {
	t.Helper()

	body := bytes.NewBufferString(`{"client_id":"` + clientID + `","title":"` + title + `","channel":"Brand + Paid Social"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/briefs", body)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("create brief status = %d, want %d, body = %s", rec.Code, http.StatusCreated, rec.Body.String())
	}

	var payload struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	return payload.Data.ID
}
