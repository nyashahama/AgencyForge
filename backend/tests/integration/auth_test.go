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
	resetAuthTables(t)
	router := newAuthTestRouter(t)

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

func TestAuthResponsesIncludeRequestID_Integration(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable"
	}

	t.Setenv("DATABASE_URL", dbURL)
	t.Setenv("JWT_SECRET", strings.Repeat("a", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")

	resetAuthTables(t)

	router := newAuthTestRouter(t)

	email := "demo+" + strings.ToLower(strings.ReplaceAll(time.Now().UTC().Format("20060102150405.000000"), ".", "")) + "@agencyforge.test"

	registerBody := bytes.NewBufferString(`{"name":"Sophia Lund","email":"` + email + `","password":"password123"}`)
	registerReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", registerBody)
	registerReq.Header.Set("X-Request-ID", "req-hardening-123")
	registerRec := httptest.NewRecorder()

	router.ServeHTTP(registerRec, registerReq)

	if registerRec.Header().Get("X-Request-ID") != "req-hardening-123" {
		t.Fatalf("X-Request-ID = %q, want req-hardening-123", registerRec.Header().Get("X-Request-ID"))
	}
}

func TestRefreshTokensAreNotStoredInPlaintext_Integration(t *testing.T) {
	resetAuthTables(t)
	router := newAuthTestRouter(t)

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
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(registerRec.Body).Decode(&registerPayload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	var storedToken string
	err := testDB.QueryRow(context.Background(), `
		SELECT rt.token
		FROM refresh_tokens rt
		JOIN users u ON u.id = rt.user_id
		WHERE u.email = $1
		ORDER BY rt.created_at DESC
		LIMIT 1
	`, email).Scan(&storedToken)
	if err != nil {
		t.Fatalf("query refresh token: %v", err)
	}

	if storedToken == registerPayload.Data.RefreshToken {
		t.Fatal("refresh token was stored in plaintext")
	}
}

func TestAuthRateLimit_Integration(t *testing.T) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable"
	}

	t.Setenv("DATABASE_URL", dbURL)
	t.Setenv("JWT_SECRET", strings.Repeat("a", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("AUTH_RATE_LIMIT_REQUESTS", "2")
	t.Setenv("AUTH_RATE_LIMIT_WINDOW", "1m")

	resetAuthTables(t)

	router := newAuthTestRouter(t)

	email := "limit+" + strings.ToLower(strings.ReplaceAll(time.Now().UTC().Format("20060102150405.000000"), ".", "")) + "@agencyforge.test"

	registerBody := bytes.NewBufferString(`{"name":"Rate Limited","email":"` + email + `","password":"password123"}`)
	registerReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", registerBody)
	registerReq.RemoteAddr = "203.0.113.40:4000"
	registerRec := httptest.NewRecorder()
	router.ServeHTTP(registerRec, registerReq)

	if registerRec.Code != http.StatusCreated {
		t.Fatalf("register status = %d, want %d, body = %s", registerRec.Code, http.StatusCreated, registerRec.Body.String())
	}

	for i := 0; i < 2; i++ {
		loginBody := bytes.NewBufferString(`{"email":"` + email + `","password":"password123"}`)
		loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", loginBody)
		loginReq.RemoteAddr = "203.0.113.40:4000"
		loginRec := httptest.NewRecorder()
		router.ServeHTTP(loginRec, loginReq)

		if loginRec.Code != http.StatusOK {
			t.Fatalf("login attempt %d status = %d, want %d, body = %s", i+1, loginRec.Code, http.StatusOK, loginRec.Body.String())
		}
	}

	blockedBody := bytes.NewBufferString(`{"email":"` + email + `","password":"password123"}`)
	blockedReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", blockedBody)
	blockedReq.RemoteAddr = "203.0.113.40:4000"
	blockedRec := httptest.NewRecorder()
	router.ServeHTTP(blockedRec, blockedReq)

	if blockedRec.Code != http.StatusTooManyRequests {
		t.Fatalf("blocked status = %d, want %d, body = %s", blockedRec.Code, http.StatusTooManyRequests, blockedRec.Body.String())
	}
	if blockedRec.Header().Get("Retry-After") == "" {
		t.Fatal("Retry-After header = empty, want retry hint")
	}
}

func newAuthTestRouter(t *testing.T) http.Handler {
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
		Clients:   client.NewHandler(client.NewService(nil)),
		Briefs:    brief.NewHandler(brief.NewService(nil)),
		Campaigns: campaign.NewHandler(campaign.NewService(nil)),
		Portals:   portal.NewHandler(portal.NewService(nil)),
	})
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

	_, err = testDB.Exec(context.Background(), `
		INSERT INTO specialists (name, code, specialty_type, is_system)
		VALUES
			('Copy', 'copy', 'creative', TRUE),
			('Design', 'design', 'creative', TRUE),
			('Media', 'media', 'strategy', TRUE),
			('Legal', 'legal', 'compliance', TRUE),
			('Budget', 'budget', 'finance', TRUE),
			('Portal', 'portal', 'delivery', TRUE)
		ON CONFLICT (code) DO NOTHING
	`)
	if err != nil {
		t.Fatalf("seed specialists: %v", err)
	}
}
