//go:build integration

package integration

import (
	"bytes"
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
	"github.com/nyashahama/AgencyForge/backend/internal/invite"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	platformemail "github.com/nyashahama/AgencyForge/backend/internal/platform/email"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/health"
	"github.com/nyashahama/AgencyForge/backend/internal/portal"
	"github.com/nyashahama/AgencyForge/backend/internal/server"
	"github.com/nyashahama/AgencyForge/backend/internal/workspace"
)

func TestWorkspacePlaybooksSettingsActivity_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	token := registerTestUser(t, router, "Sophia Lund")

	settingsReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/settings", nil)
	settingsReq.Header.Set("Authorization", "Bearer "+token)
	settingsRec := httptest.NewRecorder()
	router.ServeHTTP(settingsRec, settingsReq)

	if settingsRec.Code != http.StatusOK {
		t.Fatalf("settings status = %d, want %d, body = %s", settingsRec.Code, http.StatusOK, settingsRec.Body.String())
	}

	var settingsPayload struct {
		Data []struct {
			Key   string `json:"key"`
			Name  string `json:"name"`
			Items []struct {
				Key   string `json:"key"`
				Label string `json:"label"`
				Value string `json:"value"`
			} `json:"items"`
		} `json:"data"`
	}
	if err := json.NewDecoder(settingsRec.Body).Decode(&settingsPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if len(settingsPayload.Data) != 3 {
		t.Fatalf("settings groups = %d, want 3", len(settingsPayload.Data))
	}

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/playbooks", bytes.NewBufferString(`{
		"name":"Client onboarding",
		"category":"Operations",
		"status":"draft",
		"body":"Use the onboarding checklist."
	}`))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create playbook status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID       string `json:"id"`
			Name     string `json:"name"`
			Category string `json:"category"`
			Status   string `json:"status"`
			Body     string `json:"body"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if created.Data.Name != "Client onboarding" || created.Data.Status != "draft" {
		t.Fatalf("unexpected created playbook: %+v", created.Data)
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/playbooks?page=1&per_page=10", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("list playbooks status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}

	var listed struct {
		Data []struct {
			ID        string `json:"id"`
			OwnerName string `json:"owner_name"`
			Status    string `json:"status"`
		} `json:"data"`
		Meta struct {
			Total int `json:"total"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(listRec.Body).Decode(&listed); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if listed.Meta.Total != 1 || len(listed.Data) != 1 {
		t.Fatalf("playbook total=%d len=%d, want 1", listed.Meta.Total, len(listed.Data))
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/playbooks/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("get playbook status = %d, want %d, body = %s", getRec.Code, http.StatusOK, getRec.Body.String())
	}

	updateReq := httptest.NewRequest(http.MethodPatch, "/api/v1/workspace/playbooks/"+created.Data.ID, bytes.NewBufferString(`{
		"status":"published",
		"body":"Use the onboarding checklist and kickoff agenda."
	}`))
	updateReq.Header.Set("Authorization", "Bearer "+token)
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("update playbook status = %d, want %d, body = %s", updateRec.Code, http.StatusOK, updateRec.Body.String())
	}

	var updated struct {
		Data struct {
			Status      string  `json:"status"`
			PublishedAt *string `json:"published_at"`
			Body        string  `json:"body"`
		} `json:"data"`
	}
	if err := json.NewDecoder(updateRec.Body).Decode(&updated); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if updated.Data.Status != "published" || updated.Data.PublishedAt == nil {
		t.Fatalf("unexpected updated playbook: %+v", updated.Data)
	}

	updateSettingsReq := httptest.NewRequest(http.MethodPatch, "/api/v1/workspace/settings", bytes.NewBufferString(`{
		"items":[
			{"group_key":"workspace_identity","item_key":"default_portal_theme","value":"Obsidian / Sand"},
			{"group_key":"notifications","item_key":"client_digest","value":"Daily 09:30"}
		]
	}`))
	updateSettingsReq.Header.Set("Authorization", "Bearer "+token)
	updateSettingsRec := httptest.NewRecorder()
	router.ServeHTTP(updateSettingsRec, updateSettingsReq)

	if updateSettingsRec.Code != http.StatusOK {
		t.Fatalf("update settings status = %d, want %d, body = %s", updateSettingsRec.Code, http.StatusOK, updateSettingsRec.Body.String())
	}

	var updatedSettings struct {
		Data []struct {
			Key   string `json:"key"`
			Items []struct {
				Key   string `json:"key"`
				Value string `json:"value"`
			} `json:"items"`
		} `json:"data"`
	}
	if err := json.NewDecoder(updateSettingsRec.Body).Decode(&updatedSettings); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	activityReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/activity?limit=10", nil)
	activityReq.Header.Set("Authorization", "Bearer "+token)
	activityRec := httptest.NewRecorder()
	router.ServeHTTP(activityRec, activityReq)

	if activityRec.Code != http.StatusOK {
		t.Fatalf("activity status = %d, want %d, body = %s", activityRec.Code, http.StatusOK, activityRec.Body.String())
	}

	var activityPayload struct {
		Data []struct {
			EventType string `json:"event_type"`
			Message   string `json:"message"`
			Icon      string `json:"icon"`
		} `json:"data"`
		Meta struct {
			Total int `json:"total"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(activityRec.Body).Decode(&activityPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if activityPayload.Meta.Total < 3 || len(activityPayload.Data) < 3 {
		t.Fatalf("activity total=%d len=%d, want at least 3", activityPayload.Meta.Total, len(activityPayload.Data))
	}
	if activityPayload.Data[0].EventType != "settings.updated" {
		t.Fatalf("latest activity event = %q, want settings.updated", activityPayload.Data[0].EventType)
	}
}

func TestWorkspaceDataIsAgencyScoped_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	tokenA := registerTestUser(t, router, "Ava Grant")
	tokenB := registerTestUser(t, router, "Marcus Reid")

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/playbooks", bytes.NewBufferString(`{
		"name":"Revision policy",
		"category":"Delivery"
	}`))
	createReq.Header.Set("Authorization", "Bearer "+tokenA)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create playbook status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/playbooks/"+created.Data.ID, nil)
	getReq.Header.Set("Authorization", "Bearer "+tokenB)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusNotFound {
		t.Fatalf("cross-agency get status = %d, want %d, body = %s", getRec.Code, http.StatusNotFound, getRec.Body.String())
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/playbooks?page=1&per_page=10", nil)
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

	activityReq := httptest.NewRequest(http.MethodGet, "/api/v1/workspace/activity?limit=10", nil)
	activityReq.Header.Set("Authorization", "Bearer "+tokenB)
	activityRec := httptest.NewRecorder()
	router.ServeHTTP(activityRec, activityReq)

	if activityRec.Code != http.StatusOK {
		t.Fatalf("cross-agency activity status = %d, want %d, body = %s", activityRec.Code, http.StatusOK, activityRec.Body.String())
	}
}

func newWorkspaceTestRouter(t *testing.T) http.Handler {
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
	inviteService := invite.NewService(db, platformemail.NewNoopMailer(), cfg.AppBaseURL, cfg.JWTSecret, 15*time.Minute, 168*time.Hour)
	return server.NewRouter(cfg, slog.New(slog.NewTextHandler(os.Stdout, nil)), server.Handlers{
		Health:    health.New(testDB),
		Auth:      auth.NewHandler(auth.NewService(db, cfg.JWTSecret, 15*time.Minute, 168*time.Hour)),
		Clients:   client.NewHandler(client.NewService(db)),
		Briefs:    brief.NewHandler(brief.NewService(db)),
		Campaigns: campaign.NewHandler(campaign.NewService(db)),
		Portals:   portal.NewHandler(portal.NewService(db)),
		Invites:   invite.NewHandler(inviteService),
		Workspace: workspace.NewHandler(workspace.NewService(db)),
	})
}
