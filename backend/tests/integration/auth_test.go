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

func TestRegisterLoginRefreshLogoutMe_Integration(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable"
	}

	t.Setenv("DATABASE_URL", dbURL)
	t.Setenv("JWT_SECRET", strings.Repeat("a", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")

	resetAuthTables(t)

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("config.Load() error = %v", err)
	}

	db := &database.Pool{Pool: testDB}
	router := server.NewRouter(cfg, slog.New(slog.NewTextHandler(os.Stdout, nil)), server.Handlers{
		Health:    health.New(testDB),
		Auth:      auth.NewHandler(auth.NewService(db, cfg.JWTSecret, 15*time.Minute, 168*time.Hour)),
		Clients:   client.NewHandler(client.NewService(nil)),
		Briefs:    brief.NewHandler(brief.NewService(nil)),
		Campaigns: campaign.NewHandler(campaign.NewService(nil)),
		Portals:   portal.NewHandler(portal.NewService(nil)),
	})

	email := "demo+" + strings.ToLower(strings.ReplaceAll(time.Now().UTC().Format("20060102150405.000000"), ".", "")) + "@agencyforge.test"

	registerBody := bytes.NewBufferString(`{"name":"Sophia Lund","email":"` + email + `","password":"password123"}`)
	registerReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", registerBody)
	registerRec := httptest.NewRecorder()

	router.ServeHTTP(registerRec, registerReq)

	if registerRec.Code != http.StatusCreated {
		t.Fatalf("register status = %d, want %d, body = %s", registerRec.Code, http.StatusCreated, registerRec.Body.String())
	}

	var registerPayload struct {
		Data struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
			User         struct {
				Email string `json:"email"`
				Name  string `json:"name"`
			} `json:"user"`
		} `json:"data"`
	}
	if err := json.NewDecoder(registerRec.Body).Decode(&registerPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if registerPayload.Data.User.Email != email {
		t.Fatalf("registered email = %q, want %q", registerPayload.Data.User.Email, email)
	}

	loginBody := bytes.NewBufferString(`{"email":"` + email + `","password":"password123"}`)
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", loginBody)
	loginRec := httptest.NewRecorder()

	router.ServeHTTP(loginRec, loginReq)

	if loginRec.Code != http.StatusOK {
		t.Fatalf("login status = %d, want %d, body = %s", loginRec.Code, http.StatusOK, loginRec.Body.String())
	}

	var loginPayload struct {
		Data struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(loginRec.Body).Decode(&loginPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	meReq := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+registerPayload.Data.AccessToken)
	meRec := httptest.NewRecorder()

	router.ServeHTTP(meRec, meReq)

	if meRec.Code != http.StatusOK {
		t.Fatalf("me status = %d, want %d, body = %s", meRec.Code, http.StatusOK, meRec.Body.String())
	}

	var mePayload struct {
		Data struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(meRec.Body).Decode(&mePayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if mePayload.Data.Email != email {
		t.Fatalf("me email = %q, want %q", mePayload.Data.Email, email)
	}

	refreshBody := bytes.NewBufferString(`{"refresh_token":"` + loginPayload.Data.RefreshToken + `"}`)
	refreshReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", refreshBody)
	refreshRec := httptest.NewRecorder()

	router.ServeHTTP(refreshRec, refreshReq)

	if refreshRec.Code != http.StatusOK {
		t.Fatalf("refresh status = %d, want %d, body = %s", refreshRec.Code, http.StatusOK, refreshRec.Body.String())
	}

	var refreshPayload struct {
		Data struct {
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(refreshRec.Body).Decode(&refreshPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if refreshPayload.Data.RefreshToken == loginPayload.Data.RefreshToken {
		t.Fatal("refresh token was not rotated")
	}

	reuseRefreshBody := bytes.NewBufferString(`{"refresh_token":"` + loginPayload.Data.RefreshToken + `"}`)
	reuseRefreshReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", reuseRefreshBody)
	reuseRefreshRec := httptest.NewRecorder()

	router.ServeHTTP(reuseRefreshRec, reuseRefreshReq)

	if reuseRefreshRec.Code != http.StatusUnauthorized {
		t.Fatalf("reused refresh status = %d, want %d, body = %s", reuseRefreshRec.Code, http.StatusUnauthorized, reuseRefreshRec.Body.String())
	}

	logoutBody := bytes.NewBufferString(`{"refresh_token":"` + refreshPayload.Data.RefreshToken + `"}`)
	logoutReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", logoutBody)
	logoutRec := httptest.NewRecorder()

	router.ServeHTTP(logoutRec, logoutReq)

	if logoutRec.Code != http.StatusNoContent {
		t.Fatalf("logout status = %d, want %d, body = %s", logoutRec.Code, http.StatusNoContent, logoutRec.Body.String())
	}

	postLogoutRefreshBody := bytes.NewBufferString(`{"refresh_token":"` + refreshPayload.Data.RefreshToken + `"}`)
	postLogoutRefreshReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", postLogoutRefreshBody)
	postLogoutRefreshRec := httptest.NewRecorder()

	router.ServeHTTP(postLogoutRefreshRec, postLogoutRefreshReq)

	if postLogoutRefreshRec.Code != http.StatusUnauthorized {
		t.Fatalf("post logout refresh status = %d, want %d, body = %s", postLogoutRefreshRec.Code, http.StatusUnauthorized, postLogoutRefreshRec.Body.String())
	}
}

func resetAuthTables(t *testing.T) {
	t.Helper()

	_, err := testDB.Exec(context.Background(), `
		TRUNCATE TABLE
			activity_events,
			playbooks,
			setting_items,
			setting_groups,
			portal_shares,
			portal_publications,
			portal_review_flows,
			portals,
			campaign_approvals,
			campaign_deliverables,
			campaign_status_history,
			campaign_assignments,
			specialists,
			campaigns,
			brief_status_history,
			brief_documents,
			briefs,
			client_touchpoints,
			client_contacts,
			clients,
			refresh_tokens,
			agency_memberships,
			users,
			agencies
		RESTART IDENTITY CASCADE
	`)
	if err != nil {
		t.Fatalf("reset auth tables: %v", err)
	}
}
