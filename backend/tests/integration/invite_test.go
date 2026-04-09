//go:build integration

package integration

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestOwnerCanCreateAndResendInvite_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	token := registerTestUser(t, router, "Owner Launch")

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/invites", bytes.NewBufferString(`{
		"email":"operator@agencyforge.test",
		"role":"member"
	}`))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("create invite status = %d, want %d, body = %s", createRec.Code, http.StatusCreated, createRec.Body.String())
	}

	var created struct {
		Data struct {
			ID    string `json:"id"`
			Email string `json:"email"`
			Role  string `json:"role"`
		} `json:"data"`
	}
	if err := json.NewDecoder(createRec.Body).Decode(&created); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if created.Data.Email != "operator@agencyforge.test" {
		t.Fatalf("invite email = %q, want operator@agencyforge.test", created.Data.Email)
	}
	if created.Data.Role != "member" {
		t.Fatalf("invite role = %q, want member", created.Data.Role)
	}

	resendReq := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/invites/"+created.Data.ID+"/resend", nil)
	resendReq.Header.Set("Authorization", "Bearer "+token)
	resendRec := httptest.NewRecorder()
	router.ServeHTTP(resendRec, resendReq)

	if resendRec.Code != http.StatusOK {
		t.Fatalf("resend invite status = %d, want %d, body = %s", resendRec.Code, http.StatusOK, resendRec.Body.String())
	}
}

func TestViewerCannotCreateInvite_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	initialToken := registerTestUser(t, router, "Viewer Launch")
	claims := parseClaims(t, initialToken)
	setUserRole(t, claims.Subject, "viewer")

	token := loginTestUser(t, router, claims.Email)

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/invites", bytes.NewBufferString(`{
		"email":"nope@agencyforge.test",
		"role":"member"
	}`))
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusForbidden {
		t.Fatalf("create invite status = %d, want %d, body = %s", createRec.Code, http.StatusForbidden, createRec.Body.String())
	}
}

func TestAcceptInvite_Integration(t *testing.T) {
	resetAuthTables(t)

	router := newWorkspaceTestRouter(t)
	ownerToken := registerTestUser(t, router, "Owner Invite")
	claims := parseClaims(t, ownerToken)

	rawToken := "invite-token-acceptance"
	inviteID := seedInviteRecord(t, claims.AgencyID, claims.Subject, "operator.accept@agencyforge.test", "member", rawToken, time.Now().UTC().Add(24*time.Hour))

	acceptReq := httptest.NewRequest(http.MethodPost, "/api/v1/invites/"+rawToken+"/accept", bytes.NewBufferString(`{
		"name":"Operator Accept",
		"password":"password123"
	}`))
	acceptRec := httptest.NewRecorder()
	router.ServeHTTP(acceptRec, acceptReq)

	if acceptRec.Code != http.StatusOK {
		t.Fatalf("accept invite status = %d, want %d, body = %s", acceptRec.Code, http.StatusOK, acceptRec.Body.String())
	}

	var accepted struct {
		Data struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
			User         struct {
				Email string `json:"email"`
				Role  string `json:"role"`
			} `json:"user"`
		} `json:"data"`
	}
	if err := json.NewDecoder(acceptRec.Body).Decode(&accepted); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if accepted.Data.User.Email != "operator.accept@agencyforge.test" {
		t.Fatalf("accepted email = %q, want operator.accept@agencyforge.test", accepted.Data.User.Email)
	}
	if accepted.Data.User.Role != "member" {
		t.Fatalf("accepted role = %q, want member", accepted.Data.User.Role)
	}
	if accepted.Data.AccessToken == "" || accepted.Data.RefreshToken == "" {
		t.Fatal("expected accepted invite to return session tokens")
	}

	var acceptedAt time.Time
	err := testDB.QueryRow(context.Background(), `
		SELECT accepted_at
		FROM operator_invites
		WHERE id = $1
	`, inviteID).Scan(&acceptedAt)
	if err != nil {
		t.Fatalf("query accepted invite: %v", err)
	}
	if acceptedAt.IsZero() {
		t.Fatal("accepted_at = zero, want invite acceptance timestamp")
	}
}

func seedInviteRecord(
	t *testing.T,
	agencyID string,
	invitedByUserID string,
	email string,
	role string,
	rawToken string,
	expiresAt time.Time,
) string {
	t.Helper()

	inviteID := uuid.NewString()
	_, err := testDB.Exec(context.Background(), `
		INSERT INTO operator_invites (
			id,
			agency_id,
			email,
			role,
			token_hash,
			invited_by_user_id,
			expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, inviteID, agencyID, email, role, hashInviteToken(rawToken), invitedByUserID, expiresAt)
	if err != nil {
		t.Fatalf("insert invite: %v", err)
	}

	return inviteID
}

func hashInviteToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
