//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/nyashahama/AgencyForge/backend/internal/auth"
)

func TestViewerCannotCreateClient_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newClientTestRouter(t)
	initialToken := registerTestUser(t, router, "Viewer Persona")
	claims := parseClaims(t, initialToken)
	setUserRole(t, claims.Subject, "viewer")

	token := loginTestUser(t, router, claims.Email)

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/clients", bytes.NewBufferString(`{
		"name":"Locked Account",
		"lead_email":"ops@locked.test"
	}`))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusForbidden {
		t.Fatalf("create status = %d, want %d, body = %s", createRec.Code, http.StatusForbidden, createRec.Body.String())
	}
}

func TestMemberCannotUpdateWorkspaceSettings_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	initialToken := registerTestUser(t, router, "Member Persona")
	claims := parseClaims(t, initialToken)
	setUserRole(t, claims.Subject, "member")

	token := loginTestUser(t, router, claims.Email)

	updateReq := httptest.NewRequest(http.MethodPatch, "/api/v1/workspace/settings", bytes.NewBufferString(`{
		"items":[
			{"group_key":"workspace_identity","item_key":"default_portal_theme","value":"Obsidian / Sand"}
		]
	}`))
	updateReq.Header.Set("Authorization", "Bearer "+token)
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusForbidden {
		t.Fatalf("update settings status = %d, want %d, body = %s", updateRec.Code, http.StatusForbidden, updateRec.Body.String())
	}
}

func TestMemberCanCreatePlaybook_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	initialToken := registerTestUser(t, router, "Member Writer")
	claims := parseClaims(t, initialToken)
	setUserRole(t, claims.Subject, "member")

	token := loginTestUser(t, router, claims.Email)

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/playbooks", bytes.NewBufferString(`{
		"name":"Escalation protocol",
		"category":"Operations"
	}`))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create playbook status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}
}

func parseClaims(t *testing.T, token string) *auth.Claims {
	t.Helper()

	claims, err := auth.ValidateAccessToken(token, strings.Repeat("a", 40))
	if err != nil {
		t.Fatalf("ValidateAccessToken() error = %v", err)
	}

	return claims
}

func loginTestUser(t *testing.T, router http.Handler, email string) string {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(`{"email":"`+email+`","password":"password123"}`))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("login status = %d, want %d, body = %s", rec.Code, http.StatusOK, rec.Body.String())
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

func setUserRole(t *testing.T, userID string, role string) {
	t.Helper()

	if _, err := testDB.Exec(context.Background(), `
		UPDATE users
		SET role = $2
		WHERE id = $1
	`, userID, role); err != nil {
		t.Fatalf("set user role on users: %v", err)
	}

	if _, err := testDB.Exec(context.Background(), `
		UPDATE agency_memberships
		SET role = $2
		WHERE user_id = $1
	`, userID, role); err != nil {
		t.Fatalf("set user role on memberships: %v", err)
	}
}
