//go:build integration

package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
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

func TestClientsCRUD_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newClientTestRouter(t)
	token := registerTestUser(t, router, "Sophia Lund")

	createBody := bytes.NewBufferString(`{
		"name":"Meridian Bank",
		"health":"strong",
		"notes":"Needs quick turnaround for launch work.",
		"mrr_cents":4200000,
		"open_approvals_count":2,
		"primary_contact":{"name":"Nia Cole","email":"nia@meridian.test","role":"marketing lead"},
		"initial_touchpoint":"Kickoff call completed"
	}`)
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/clients", createBody)
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()

	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID             string `json:"id"`
			Name           string `json:"name"`
			Slug           string `json:"slug"`
			LeadEmail      string `json:"lead_email"`
			PrimaryContact struct {
				Email string `json:"email"`
			} `json:"primary_contact"`
			Contacts    []any `json:"contacts"`
			Touchpoints []any `json:"touchpoints"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if created.Data.Slug != "meridian-bank" {
		t.Fatalf("slug = %q, want meridian-bank", created.Data.Slug)
	}
	if created.Data.LeadEmail != "nia@meridian.test" {
		t.Fatalf("lead_email = %q, want nia@meridian.test", created.Data.LeadEmail)
	}
	if len(created.Data.Contacts) != 1 || len(created.Data.Touchpoints) != 1 {
		t.Fatalf("contacts=%d touchpoints=%d, want 1 each", len(created.Data.Contacts), len(created.Data.Touchpoints))
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/clients?page=1&per_page=10", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()

	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}

	var listed struct {
		Data []struct {
			ID               string `json:"id"`
			Name             string `json:"name"`
			LatestTouchpoint string `json:"latest_touchpoint"`
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

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/clients/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getRec := httptest.NewRecorder()

	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("get status = %d, want %d, body = %s", getRec.Code, http.StatusOK, getRec.Body.String())
	}

	updateBody := bytes.NewBufferString(`{
		"health":"watch",
		"notes":"Escalate weekly stakeholder check-ins.",
		"mrr_cents":4500000,
		"open_approvals_count":3,
		"primary_contact":{"name":"Nia Cole","email":"nia.cole@meridian.test","role":"vp marketing"},
		"touchpoint_note":"Stakeholder update sent"
	}`)
	updateReq := httptest.NewRequest(http.MethodPatch, "/api/v1/clients/"+created.Data.ID, updateBody)
	updateReq.Header.Set("Authorization", "Bearer "+token)
	updateRec := httptest.NewRecorder()

	router.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("update status = %d, want %d, body = %s", updateRec.Code, http.StatusOK, updateRec.Body.String())
	}

	var updated struct {
		Data struct {
			Health             string `json:"health"`
			LeadEmail          string `json:"lead_email"`
			MrrCents           int64  `json:"mrr_cents"`
			OpenApprovalsCount int32  `json:"open_approvals_count"`
			Touchpoints        []any  `json:"touchpoints"`
		} `json:"data"`
	}
	if err := json.NewDecoder(updateRec.Body).Decode(&updated); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if updated.Data.Health != "watch" {
		t.Fatalf("health = %q, want watch", updated.Data.Health)
	}
	if updated.Data.LeadEmail != "nia.cole@meridian.test" {
		t.Fatalf("lead_email = %q, want nia.cole@meridian.test", updated.Data.LeadEmail)
	}
	if updated.Data.MrrCents != 4500000 || updated.Data.OpenApprovalsCount != 3 {
		t.Fatalf("mrr/open approvals = %d/%d, want 4500000/3", updated.Data.MrrCents, updated.Data.OpenApprovalsCount)
	}
	if len(updated.Data.Touchpoints) != 2 {
		t.Fatalf("touchpoints = %d, want 2", len(updated.Data.Touchpoints))
	}
}

func TestClientsAreAgencyScoped_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newClientTestRouter(t)
	tokenA := registerTestUser(t, router, "Ava Grant")
	tokenB := registerTestUser(t, router, "Marcus Reid")

	createBody := bytes.NewBufferString(`{
		"name":"Volta Footwear",
		"lead_email":"hello@volta.test"
	}`)
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/clients", createBody)
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

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/clients/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+tokenB)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusNotFound {
		t.Fatalf("cross-agency get status = %d, want %d, body = %s", getRec.Code, http.StatusNotFound, getRec.Body.String())
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/clients", nil)
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

func newClientTestRouter(t *testing.T) http.Handler {
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
		Briefs:    brief.NewHandler(brief.NewService(nil)),
		Campaigns: campaign.NewHandler(campaign.NewService(nil)),
		Portals:   portal.NewHandler(portal.NewService(nil)),
	})
}

func registerTestUser(t *testing.T, router http.Handler, name string) string {
	t.Helper()

	email := fmt.Sprintf("%s-%d@agencyforge.test", strings.ToLower(strings.ReplaceAll(name, " ", ".")), time.Now().UTC().UnixNano())
	body := bytes.NewBufferString(`{"name":"` + name + `","email":"` + email + `","password":"password123"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", body)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("register status = %d, want %d, body = %s", rec.Code, http.StatusCreated, rec.Body.String())
	}

	var payload struct {
		Data struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	return payload.Data.AccessToken
}
