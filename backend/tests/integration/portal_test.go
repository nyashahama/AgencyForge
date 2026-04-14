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

func TestPortalsListGetUpdatePublish_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newPortalTestRouter(t)
	token := registerTestUser(t, router, "Sophia Lund")
	clientID := createClientForToken(t, router, token, "Meridian Bank", "nia@meridian.test")
	portalID := createPortalForToken(t, router, token, clientID, "Meridian Executive Portal")

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/portals?page=1&per_page=10", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("list status = %d, want %d, body = %s", listRec.Code, http.StatusOK, listRec.Body.String())
	}

	var listed struct {
		Data []struct {
			ID                       string `json:"id"`
			ClientName               string `json:"client_name"`
			Theme                    string `json:"theme"`
			ReviewMode               string `json:"review_mode"`
			ShareState               string `json:"share_state"`
			LatestPublicationVersion int32  `json:"latest_publication_version"`
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
	if listed.Data[0].ClientName != "Meridian Bank" || listed.Data[0].ShareState != "draft" {
		t.Fatalf("unexpected list payload: %+v", listed.Data[0])
	}
	if listed.Data[0].LatestPublicationVersion != 0 {
		t.Fatalf("latest publication version = %d, want 0", listed.Data[0].LatestPublicationVersion)
	}

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/portals/"+portalID, nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("get status = %d, want %d, body = %s", getRec.Code, http.StatusOK, getRec.Body.String())
	}

	var fetched struct {
		Data struct {
			Name         string `json:"name"`
			ReviewFlows  []any  `json:"review_flows"`
			Publications []any  `json:"publications"`
			Shares       []any  `json:"shares"`
		} `json:"data"`
	}
	if err := json.NewDecoder(getRec.Body).Decode(&fetched); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if fetched.Data.Name != "Meridian Executive Portal" {
		t.Fatalf("name = %q, want Meridian Executive Portal", fetched.Data.Name)
	}
	if len(fetched.Data.ReviewFlows) != 1 || len(fetched.Data.Publications) != 0 || len(fetched.Data.Shares) != 0 {
		t.Fatalf("review_flows=%d publications=%d shares=%d, want 1/0/0", len(fetched.Data.ReviewFlows), len(fetched.Data.Publications), len(fetched.Data.Shares))
	}

	updateBody := bytes.NewBufferString(`{
		"theme":"Graphite / Lime",
		"review_mode":"rolling-review",
		"description":"Executive review room for weekly approvals.",
		"default_review_flow":{
			"name":"Rolling client review",
			"review_mode":"rolling-review",
			"config":{"steps":["creative-review","client-review","publish"],"notify":"slack"}
		}
	}`)
	updateReq := httptest.NewRequest(http.MethodPatch, "/api/v1/portals/"+portalID, updateBody)
	updateReq.Header.Set("Authorization", "Bearer "+token)
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("update status = %d, want %d, body = %s", updateRec.Code, http.StatusOK, updateRec.Body.String())
	}

	var updated struct {
		Data struct {
			Theme       string `json:"theme"`
			ReviewMode  string `json:"review_mode"`
			Description string `json:"description"`
			ReviewFlows []struct {
				Name       string         `json:"name"`
				ReviewMode string         `json:"review_mode"`
				Config     map[string]any `json:"config"`
			} `json:"review_flows"`
		} `json:"data"`
	}
	if err := json.NewDecoder(updateRec.Body).Decode(&updated); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if updated.Data.Theme != "Graphite / Lime" || updated.Data.ReviewMode != "rolling-review" {
		t.Fatalf("updated portal = %+v", updated.Data)
	}
	if len(updated.Data.ReviewFlows) != 1 || updated.Data.ReviewFlows[0].Name != "Rolling client review" {
		t.Fatalf("unexpected review flow payload: %+v", updated.Data.ReviewFlows)
	}

	publishBody := bytes.NewBufferString(`{
		"share_expires_at":"2026-05-01T12:00:00Z",
		"payload":{"hero":"Q3 executive summary"}
	}`)
	publishReq := httptest.NewRequest(http.MethodPost, "/api/v1/portals/"+portalID+"/publish", publishBody)
	publishReq.Header.Set("Authorization", "Bearer "+token)
	publishRec := httptest.NewRecorder()
	router.ServeHTTP(publishRec, publishReq)

	if publishRec.Code != http.StatusOK {
		t.Fatalf("publish status = %d, want %d, body = %s", publishRec.Code, http.StatusOK, publishRec.Body.String())
	}

	var published struct {
		Data struct {
			ShareState               string `json:"share_state"`
			LatestPublicationVersion int32  `json:"latest_publication_version"`
			Publications             []struct {
				VersionNumber int32          `json:"version_number"`
				Status        string         `json:"status"`
				Payload       map[string]any `json:"payload"`
			} `json:"publications"`
			Shares []struct {
				Status      string  `json:"status"`
				AccessToken string  `json:"access_token"`
				ExpiresAt   *string `json:"expires_at"`
			} `json:"shares"`
		} `json:"data"`
	}
	if err := json.NewDecoder(publishRec.Body).Decode(&published); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if published.Data.ShareState != "published" || published.Data.LatestPublicationVersion != 1 {
		t.Fatalf("published portal = %+v", published.Data)
	}
	if len(published.Data.Publications) != 1 || published.Data.Publications[0].Status != "published" {
		t.Fatalf("unexpected publications payload: %+v", published.Data.Publications)
	}
	if published.Data.Publications[0].Payload["hero"] != "Q3 executive summary" {
		t.Fatalf("publish payload missing hero: %+v", published.Data.Publications[0].Payload)
	}
	if len(published.Data.Shares) != 1 || published.Data.Shares[0].Status != "active" || published.Data.Shares[0].AccessToken == "" {
		t.Fatalf("unexpected shares payload: %+v", published.Data.Shares)
	}

	revertBody := bytes.NewBufferString(`{"share_state":"draft"}`)
	revertReq := httptest.NewRequest(http.MethodPatch, "/api/v1/portals/"+portalID, revertBody)
	revertReq.Header.Set("Authorization", "Bearer "+token)
	revertRec := httptest.NewRecorder()
	router.ServeHTTP(revertRec, revertReq)

	if revertRec.Code != http.StatusOK {
		t.Fatalf("revert status = %d, want %d, body = %s", revertRec.Code, http.StatusOK, revertRec.Body.String())
	}

	var reverted struct {
		Data struct {
			ShareState string `json:"share_state"`
			Shares     []struct {
				Status string `json:"status"`
			} `json:"shares"`
		} `json:"data"`
	}
	if err := json.NewDecoder(revertRec.Body).Decode(&reverted); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if reverted.Data.ShareState != "draft" {
		t.Fatalf("share_state = %q, want draft", reverted.Data.ShareState)
	}
	if len(reverted.Data.Shares) != 1 || reverted.Data.Shares[0].Status != "revoked" {
		t.Fatalf("unexpected reverted shares payload: %+v", reverted.Data.Shares)
	}

	var activeShares int
	err := testDB.QueryRow(context.Background(), `SELECT COUNT(*) FROM portal_shares WHERE portal_id = $1 AND status = 'active'`, portalID).Scan(&activeShares)
	if err != nil {
		t.Fatalf("count active shares: %v", err)
	}
	if activeShares != 0 {
		t.Fatalf("active shares = %d, want 0", activeShares)
	}
}

func TestPortalsAreAgencyScoped_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newPortalTestRouter(t)
	tokenA := registerTestUser(t, router, "Ava Grant")
	tokenB := registerTestUser(t, router, "Marcus Reid")
	clientID := createClientForToken(t, router, tokenA, "Volta Footwear", "hello@volta.test")
	portalID := createPortalForToken(t, router, tokenA, clientID, "Volta Launch Room")

	getReq := httptest.NewRequest(http.MethodGet, "/api/v1/portals/"+portalID, nil)
	getReq.Header.Set("Authorization", "Bearer "+tokenB)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusNotFound {
		t.Fatalf("cross-agency get status = %d, want %d, body = %s", getRec.Code, http.StatusNotFound, getRec.Body.String())
	}

	listReq := httptest.NewRequest(http.MethodGet, "/api/v1/portals", nil)
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

func newPortalTestRouter(t *testing.T) http.Handler {
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
		Portals:   portal.NewHandler(portal.NewService(db)),
	})
}

func createPortalForToken(t *testing.T, router http.Handler, token string, clientID string, name string) string {
	t.Helper()

	body, err := json.Marshal(map[string]any{
		"client_id": clientID,
		"name":      name,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/portals", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("create portal status = %d, want %d, body = %s", rec.Code, http.StatusCreated, rec.Body.String())
	}

	var created struct {
		Data struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if created.Data.ID == "" || created.Data.Name != name {
		t.Fatalf("unexpected create payload: %+v", created.Data)
	}

	return created.Data.ID
}
