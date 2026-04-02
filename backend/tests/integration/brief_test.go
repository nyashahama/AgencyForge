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

func TestBriefsCreateListGetLaunch_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newBriefTestRouter(t)
	token := registerTestUser(t, router, "Sophia Lund")
	clientID := createClientForToken(t, router, token, "Meridian Bank", "nia@meridian.test")

	createBody := bytes.NewBufferString(`{
		"client_id":"` + clientID + `",
		"title":"Retail credit expansion",
		"channel":"Brand + Paid Social",
		"pages":14,
		"source_type":"upload",
		"documents":[
			{
				"storage_key":"briefs/meridian/retail-credit-expansion.pdf",
				"original_filename":"retail-credit-expansion.pdf",
				"media_type":"application/pdf",
				"byte_size":2048,
				"page_count":14
			}
		]
	}`)
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/briefs", createBody)
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID         string `json:"id"`
			ClientName string `json:"client_name"`
			Status     string `json:"status"`
			Documents  []any  `json:"documents"`
			History    []any  `json:"history"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if created.Data.ClientName != "Meridian Bank" {
		t.Fatalf("client_name = %q, want Meridian Bank", created.Data.ClientName)
	}
	if created.Data.Status != "new" {
		t.Fatalf("status = %q, want new", created.Data.Status)
	}
	if len(created.Data.Documents) != 1 || len(created.Data.History) != 1 {
		t.Fatalf("documents=%d history=%d, want 1 each", len(created.Data.Documents), len(created.Data.History))
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/briefs?page=1&per_page=10", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}

	var listed struct {
		Data []struct {
			ID            string `json:"id"`
			DocumentCount int64  `json:"document_count"`
			SourceType    string `json:"source_type"`
		} `json:"data"`
		Meta struct {
			Total int `json:"total"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(listRec.Body).Decode(&listed); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if listed.Meta.Total != 1 || listed.Data[0].DocumentCount != 1 || listed.Data[0].SourceType != "upload" {
		t.Fatalf("unexpected list payload: %+v", listed)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/briefs/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("get status = %d, want %d, body = %s", getRec.Code, http.StatusOK, getRec.Body.String())
	}

	launchBody := bytes.NewBufferString(`{
		"campaign_name":"Q3 Retail Credit Refresh",
		"budget_cents":18000000,
		"due_at":"2026-04-15T12:00:00Z"
	}`)
	launchReq := httptest.NewRequest(http.MethodPost, "/api/v1/briefs/"+created.Data.ID+"/launch", launchBody)
	launchReq.Header.Set("Authorization", "Bearer "+token)
	launchRec := httptest.NewRecorder()
	router.ServeHTTP(launchRec, launchReq)

	if launchRec.Code != http.StatusOK {
		t.Fatalf("launch status = %d, want %d, body = %s", launchRec.Code, http.StatusOK, launchRec.Body.String())
	}

	var launched struct {
		Data struct {
			CampaignID string `json:"campaign_id"`
			Brief      struct {
				Status  string `json:"status"`
				History []any  `json:"history"`
			} `json:"brief"`
		} `json:"data"`
	}
	if err := json.NewDecoder(launchRec.Body).Decode(&launched); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if launched.Data.Brief.Status != "launched" {
		t.Fatalf("launched brief status = %q, want launched", launched.Data.Brief.Status)
	}
	if launched.Data.CampaignID == "" {
		t.Fatal("campaign_id is empty")
	}
	if len(launched.Data.Brief.History) != 2 {
		t.Fatalf("history = %d, want 2", len(launched.Data.Brief.History))
	}

	var campaignCount int
	err := testDB.QueryRow(context.Background(), `SELECT COUNT(*) FROM campaigns WHERE brief_id = $1`, created.Data.ID).Scan(&campaignCount)
	if err != nil {
		t.Fatalf("count campaigns: %v", err)
	}
	if campaignCount != 1 {
		t.Fatalf("campaign count = %d, want 1", campaignCount)
	}

	relaunchReq := httptest.NewRequest(http.MethodPost, "/api/v1/briefs/"+created.Data.ID+"/launch", bytes.NewBufferString(`{}`))
	relaunchReq.Header.Set("Authorization", "Bearer "+token)
	relaunchRec := httptest.NewRecorder()
	router.ServeHTTP(relaunchRec, relaunchReq)

	if relaunchRec.Code != http.StatusConflict {
		t.Fatalf("relaunch status = %d, want %d, body = %s", relaunchRec.Code, http.StatusConflict, relaunchRec.Body.String())
	}
}

func TestBriefsAreAgencyScoped_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newBriefTestRouter(t)
	tokenA := registerTestUser(t, router, "Ava Grant")
	tokenB := registerTestUser(t, router, "Marcus Reid")
	clientID := createClientForToken(t, router, tokenA, "Volta Footwear", "hello@volta.test")

	createBody := bytes.NewBufferString(`{
		"client_id":"` + clientID + `",
		"title":"Summer launch 2026",
		"channel":"Multi-channel launch"
	}`)
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/briefs", createBody)
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

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/briefs/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+tokenB)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusNotFound {
		t.Fatalf("cross-agency get status = %d, want %d, body = %s", getRec.Code, http.StatusNotFound, getRec.Body.String())
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/briefs", nil)
	listReq.Header.Set("Authorization", "Bearer "+tokenB)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("cross-agency list status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}
}

func newBriefTestRouter(t *testing.T) http.Handler {
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
		Campaigns: campaign.NewHandler(campaign.NewService(nil)),
		Portals:   portal.NewHandler(portal.NewService(nil)),
	})
}

func createClientForToken(t *testing.T, router http.Handler, token string, name string, leadEmail string) string {
	t.Helper()

	body := bytes.NewBufferString(`{"name":"` + name + `","lead_email":"` + leadEmail + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/clients", body)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("client create status = %d, want %d, body = %s", rec.Code, http.StatusCreated, rec.Body.String())
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
