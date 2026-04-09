# AgencyForge Operator Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an operator-only launch of AgencyForge with secure auth, owner-managed operator invites, real brief document storage, and complete internal campaign execution for roles `owner`, `admin`, `member`, and `viewer`.

**Architecture:** Keep Go as the source of truth for all durable workflow state, authorization, invitations, and file access. Move the Next.js app to server-owned auth session handling, add invitation and document storage backends, then finish the operator surfaces for clients, briefs, and campaigns with typed contracts and end-to-end verification.

**Tech Stack:** Next.js 16, React 19, TypeScript, Go, chi, PostgreSQL, pgx/sqlc/goose, Resend, S3-compatible object storage

---

## Planned File Structure

### Backend

- Modify: `backend/internal/auth/service.go`
- Modify: `backend/internal/auth/handler.go`
- Modify: `backend/internal/auth/routes.go`
- Modify: `backend/internal/auth/errors.go`
- Modify: `backend/internal/auth/tokens.go`
- Modify: `backend/internal/server/router.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/internal/config/config_test.go`
- Modify: `backend/internal/platform/request/request.go`
- Modify: `backend/internal/platform/request/request_test.go`
- Modify: `backend/internal/platform/authctx/authctx.go`
- Modify: `backend/internal/client/service.go`
- Modify: `backend/internal/client/handler.go`
- Modify: `backend/internal/brief/service.go`
- Modify: `backend/internal/brief/handler.go`
- Modify: `backend/internal/brief/routes.go`
- Modify: `backend/internal/campaign/service.go`
- Modify: `backend/internal/campaign/handler.go`
- Modify: `backend/internal/campaign/routes.go`
- Create: `backend/internal/invite/service.go`
- Create: `backend/internal/invite/handler.go`
- Create: `backend/internal/invite/routes.go`
- Create: `backend/internal/invite/errors.go`
- Create: `backend/internal/platform/email/resend.go`
- Create: `backend/internal/platform/email/noop.go`
- Create: `backend/internal/platform/storage/s3.go`
- Create: `backend/internal/platform/storage/types.go`
- Create: `backend/internal/platform/authz/authz.go`
- Create: `backend/db/migrations/00013_security_auth_hardening.sql`
- Create: `backend/db/migrations/00014_operator_invites.sql`
- Create: `backend/db/migrations/00015_brief_document_storage.sql`
- Modify or create: `backend/db/queries/auth.sql`
- Create: `backend/db/queries/invites.sql`
- Create: `backend/db/queries/documents.sql`
- Test: `backend/internal/config/config_test.go`
- Test: `backend/internal/platform/request/request_test.go`
- Test: `backend/tests/integration/auth_test.go`
- Test: `backend/tests/integration/rbac_test.go`
- Test: `backend/tests/integration/invite_test.go`
- Test: `backend/tests/integration/brief_documents_test.go`
- Test: `backend/tests/integration/campaign_execution_test.go`

### Frontend

- Modify: `lib/auth/session.tsx`
- Modify: `lib/auth/session-store.ts`
- Create: `lib/auth/backend-auth.ts`
- Modify: `lib/api/client.ts`
- Modify: `lib/api/endpoints.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/register/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/session/route.ts`
- Create: `app/invite/[token]/page.tsx`
- Create: `app/dashboard/team/page.tsx`
- Modify: `app/dashboard/layout.tsx`
- Modify: `app/dashboard/components/navigation.ts`
- Modify: `app/dashboard/components/DashboardSidebar.tsx`
- Modify: `app/dashboard/clients/page.tsx`
- Modify: `app/dashboard/briefs/page.tsx`
- Modify: `app/dashboard/campaigns/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/signup/page.tsx`
- Create: `proxy.ts`

### Docs and Ops

- Modify: `README.md`
- Modify: `backend/README.md`
- Create: `.env.example` entries if missing
- Create: deployment/env documentation section in `README.md`

---

### Task 1: Restore Secure Auth Boundary And Add Operator Invitation Domain

**Files:**
- Create: `backend/db/migrations/00013_security_auth_hardening.sql`
- Create: `backend/db/migrations/00014_operator_invites.sql`
- Modify: `backend/db/queries/auth.sql`
- Create: `backend/db/queries/invites.sql`
- Modify: `backend/internal/auth/service.go`
- Modify: `backend/internal/auth/handler.go`
- Modify: `backend/internal/auth/routes.go`
- Modify: `backend/internal/auth/errors.go`
- Modify: `backend/internal/auth/tokens.go`
- Modify: `backend/internal/server/router.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/internal/config/config_test.go`
- Modify: `backend/internal/platform/request/request.go`
- Modify: `backend/internal/platform/request/request_test.go`
- Create: `backend/internal/invite/service.go`
- Create: `backend/internal/invite/handler.go`
- Create: `backend/internal/invite/routes.go`
- Create: `backend/internal/invite/errors.go`
- Create: `backend/internal/platform/email/resend.go`
- Create: `backend/internal/platform/email/noop.go`
- Create: `backend/internal/platform/authz/authz.go`
- Create: `lib/auth/backend-auth.ts`
- Modify: `lib/auth/session-store.ts`
- Modify: `lib/auth/session.tsx`
- Modify: `lib/api/client.ts`
- Modify: `lib/api/endpoints.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/register/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/session/route.ts`
- Create: `app/invite/[token]/page.tsx`
- Create: `app/dashboard/team/page.tsx`
- Modify: `app/dashboard/layout.tsx`
- Modify: `app/dashboard/components/navigation.ts`
- Modify: `app/dashboard/components/DashboardSidebar.tsx`
- Create: `proxy.ts`
- Test: `backend/internal/config/config_test.go`
- Test: `backend/internal/platform/request/request_test.go`
- Test: `backend/tests/integration/auth_test.go`
- Test: `backend/tests/integration/invite_test.go`
- Test: `backend/tests/integration/rbac_test.go`

- [ ] **Step 1: Write failing backend tests for auth hardening and invitations**

```go
func TestRefreshTokensAreNotStoredInPlaintext_Integration(t *testing.T) {
	resetAuthTables(t)
	router := newAuthTestRouter(t)

	token := registerAndCaptureRefreshToken(t, router)
	stored := fetchStoredRefreshToken(t)

	if stored == token {
		t.Fatal("refresh token stored in plaintext")
	}
}

func TestOwnerCanCreateAndResendInvite_Integration(t *testing.T) {
	resetAuthTables(t)
	router := newInviteTestRouter(t)
	ownerToken := registerTestUser(t, router, "Owner Launch")

	body := bytes.NewBufferString(`{"email":"operator@agencyforge.test","role":"member"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/invites", body)
	req.Header.Set("Authorization", "Bearer "+ownerToken)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d, body = %s", rec.Code, http.StatusCreated, rec.Body.String())
	}
}

func TestViewerCannotCreateInvite_Integration(t *testing.T) {
	resetAuthTables(t)
	router := newInviteTestRouter(t)
	viewerToken := registerViewerUser(t, router, "Viewer Launch")

	req := httptest.NewRequest(http.MethodPost, "/api/v1/workspace/invites", bytes.NewBufferString(`{"email":"nope@test","role":"member"}`))
	req.Header.Set("Authorization", "Bearer "+viewerToken)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusForbidden)
	}
}
```

- [ ] **Step 2: Run the focused backend tests to verify they fail**

Run:

```bash
cd backend
go test ./internal/config ./internal/platform/request -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -run 'TestRefreshTokensAreNotStoredInPlaintext_Integration|TestOwnerCanCreateAndResendInvite_Integration|TestViewerCannotCreateInvite_Integration' -count=1
```

Expected:

- config and request tests fail because new auth/storage/email settings are not defined yet
- integration tests fail because invitation tables, routes, and handlers do not exist yet

- [ ] **Step 3: Add migrations, SQL, and backend services for invitation lifecycle and auth hardening**

Key structures to implement:

```sql
CREATE TABLE operator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX operator_invites_active_email_idx
  ON operator_invites (agency_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
```

```go
type Mailer interface {
	SendInvite(ctx context.Context, invite InviteEmail) error
}

type InviteService struct {
	db     *database.Pool
	mailer email.Mailer
}

func (s *InviteService) Create(ctx context.Context, principal authctx.Principal, input CreateInviteInput) (*Invite, error)
func (s *InviteService) Resend(ctx context.Context, principal authctx.Principal, inviteID uuid.UUID) (*Invite, error)
func (s *InviteService) Revoke(ctx context.Context, principal authctx.Principal, inviteID uuid.UUID) error
func (s *InviteService) Accept(ctx context.Context, token string, input AcceptInviteInput) (*auth.Session, error)
```

Required behavior:

- hash invite tokens before storage
- generate expiring acceptance tokens
- only `owner` and `admin` can manage invites
- preserve refresh-token hashing and strict request decoding
- add explicit config for `RESEND_API_KEY`, `EMAIL_FROM`, `INVITE_BASE_URL`, `EXPOSE_METRICS`, and `TRUST_PROXY_HEADERS`

- [ ] **Step 4: Add Next.js server-owned auth and invite acceptance UI**

Implement these route handlers and client APIs:

```ts
export async function POST(request: Request) {
  const body = await request.json();
  const session = await loginWithBackend(body);
  await setSession({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
  });
  return NextResponse.json({ data: toAuthSession(session) });
}
```

```ts
export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get("af_refresh_token")?.value;
  if (!refreshToken) return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}
```

```tsx
export default function InviteAcceptPage() {
  return (
    <main>
      <form>{/* name, password, accept invite */}</form>
    </main>
  );
}
```

Required UI behavior:

- dashboard routes enforce auth at the server boundary
- client JS no longer owns refresh-token cookies
- invite acceptance page handles invalid, expired, revoked, and already-used tokens
- team management page lists invites and supports create/resend/revoke

- [ ] **Step 5: Run auth and invitation verification**

Run:

```bash
cd backend
go test ./internal/config ./internal/platform/request ./internal/server -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -run 'TestRefreshTokensAreNotStoredInPlaintext_Integration|TestOwnerCanCreateAndResendInvite_Integration|TestViewerCannotCreateInvite_Integration' -count=1

cd ..
npm run lint
npm run build
```

Expected:

- all commands exit `0`
- build output shows dashboard routes as dynamic and proxy-protected

- [ ] **Step 6: Commit**

```bash
git add backend app lib proxy.ts
git commit -m "feat: add secure operator auth and invite flows"
```

---

### Task 2: Add Real Brief Document Storage With Preview And Download

**Files:**
- Create: `backend/db/migrations/00015_brief_document_storage.sql`
- Create: `backend/db/queries/documents.sql`
- Modify: `backend/internal/brief/service.go`
- Modify: `backend/internal/brief/handler.go`
- Modify: `backend/internal/brief/routes.go`
- Create: `backend/internal/platform/storage/types.go`
- Create: `backend/internal/platform/storage/s3.go`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/internal/config/config_test.go`
- Modify: `lib/api/client.ts`
- Modify: `lib/api/endpoints.ts`
- Modify: `app/dashboard/briefs/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Test: `backend/tests/integration/brief_documents_test.go`

- [ ] **Step 1: Write the failing brief document integration tests**

```go
func TestCreateBriefUploadCompleteAndDownload_Integration(t *testing.T) {
	resetAuthTables(t)
	router := newBriefTestRouter(t)
	token := registerTestUser(t, router, "Brief Operator")

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/briefs", bytes.NewBufferString(`{"client_id":"<client-id>","title":"Launch brief","channel":"paid-social"}`))
	createReq.Header.Set("Authorization", "Bearer "+token)

	uploadReq := httptest.NewRequest(http.MethodPost, "/api/v1/briefs/<brief-id>/documents", bytes.NewBufferString(`{"filename":"brief.pdf","media_type":"application/pdf","byte_size":1024}`))
	uploadReq.Header.Set("Authorization", "Bearer "+token)

	downloadReq := httptest.NewRequest(http.MethodGet, "/api/v1/briefs/<brief-id>/documents/<document-id>/download", nil)
	downloadReq.Header.Set("Authorization", "Bearer "+token)
}
```

- [ ] **Step 2: Run the brief document integration test to verify it fails**

Run:

```bash
cd backend
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -run TestCreateBriefUploadCompleteAndDownload_Integration -count=1
```

Expected:

- test fails because document upload/download endpoints and storage abstraction do not exist

- [ ] **Step 3: Add storage abstraction, DB metadata, and brief document endpoints**

Implement a storage boundary like:

```go
type Storage interface {
	CreateUpload(ctx context.Context, key string, contentType string, size int64) (*SignedUpload, error)
	CreateDownload(ctx context.Context, key string, filename string, inline bool) (string, error)
}

type SignedUpload struct {
	URL     string
	Method  string
	Headers map[string]string
}
```

Add brief routes:

```go
r.Post("/{briefID}/documents", h.CreateDocumentUpload)
r.Post("/{briefID}/documents/{documentID}/complete", h.CompleteDocumentUpload)
r.Get("/{briefID}/documents/{documentID}/download", h.DownloadDocument)
r.Get("/{briefID}/documents/{documentID}/preview", h.PreviewDocument)
```

Required behavior:

- generate storage keys that include agency and brief identity
- persist document status such as `pending` and `uploaded`
- only allow preview for safe inline media types
- only return signed URLs to authorized operators in the same agency

- [ ] **Step 4: Replace the briefs page dropzone with real upload, preview, and download flows**

Implement a frontend shape like:

```ts
const upload = await briefsApi.createDocumentUpload(briefId, {
  filename: file.name,
  media_type: file.type || "application/octet-stream",
  byte_size: file.size,
}, accessToken);

await fetch(upload.upload.url, {
  method: upload.upload.method,
  headers: upload.upload.headers,
  body: file,
});

await briefsApi.completeDocumentUpload(briefId, upload.document.id, accessToken);
```

Required UI behavior:

- upload progress or at least upload-state feedback
- per-document preview and download actions
- visible validation errors for unsupported files
- refreshed brief document list after completion

- [ ] **Step 5: Run document storage verification**

Run:

```bash
cd backend
go test ./... -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -run TestCreateBriefUploadCompleteAndDownload_Integration -count=1

cd ..
npm run lint
npm run build
```

Expected:

- all commands exit `0`
- briefs page compiles with real document actions wired

- [ ] **Step 6: Commit**

```bash
git add backend app lib
git commit -m "feat: add stored brief documents with preview and download"
```

---

### Task 3: Complete Internal Campaign Execution

**Files:**
- Modify: `backend/internal/campaign/service.go`
- Modify: `backend/internal/campaign/handler.go`
- Modify: `backend/internal/campaign/routes.go`
- Modify: `backend/internal/brief/service.go`
- Modify: `backend/internal/client/service.go`
- Modify: `lib/api/client.ts`
- Modify: `lib/api/endpoints.ts`
- Modify: `app/dashboard/campaigns/page.tsx`
- Modify: `app/dashboard/briefs/page.tsx`
- Modify: `app/dashboard/clients/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Test: `backend/tests/integration/campaign_execution_test.go`

- [ ] **Step 1: Write the failing campaign execution integration tests**

```go
func TestCampaignExecutionCrudAssignmentsDeliverablesApprovals_Integration(t *testing.T) {
	resetAuthTables(t)
	router := newCampaignTestRouter(t)
	token := registerTestUser(t, router, "Execution Operator")

	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/campaigns", bytes.NewBufferString(`{
	  "client_id":"<client-id>",
	  "name":"Operator Launch",
	  "assignments":[{"specialist_code":"copy","status":"active","load_units":3}],
	  "deliverables":[{"name":"Headline set","deliverable_type":"copy","status":"draft"}],
	  "approvals":[{"approver_name":"Ava","approver_email":"ava@test","status":"pending"}]
	}`))
	createReq.Header.Set("Authorization", "Bearer "+token)

	updateReq := httptest.NewRequest(http.MethodPatch, "/api/v1/campaigns/<campaign-id>", bytes.NewBufferString(`{"status":"review"}`))
	updateReq.Header.Set("Authorization", "Bearer "+token)

	advanceReq := httptest.NewRequest(http.MethodPost, "/api/v1/campaigns/<campaign-id>/advance", bytes.NewBufferString(`{"note":"Ready for internal review"}`))
	advanceReq.Header.Set("Authorization", "Bearer "+token)
}
```

- [ ] **Step 2: Run the focused campaign execution integration tests to verify they fail**

Run:

```bash
cd backend
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -run TestCampaignExecutionCrudAssignmentsDeliverablesApprovals_Integration -count=1
```

Expected:

- test fails because at least one of the operator execution surfaces is still incomplete or contract-misaligned

- [ ] **Step 3: Harden the backend campaign APIs around operator execution**

Implement and verify these backend guarantees:

```go
func (s *Service) Create(ctx context.Context, principal authctx.Principal, input CreateInput) (*Detail, error)
func (s *Service) Update(ctx context.Context, principal authctx.Principal, campaignID uuid.UUID, input UpdateInput) (*Detail, error)
func (s *Service) Advance(ctx context.Context, principal authctx.Principal, campaignID uuid.UUID, input AdvanceInput) (*Detail, error)
```

Required behavior:

- owner/admin/member can mutate
- viewer is forbidden
- assignments, deliverables, and approvals remain agency-scoped
- status history is always consistent with progression
- brief launch path creates campaign state the UI can immediately manage

- [ ] **Step 4: Finish the operator campaign, brief, client, and overview pages against real DTOs**

Use typed shapes like:

```ts
type CampaignUpdateInput = {
  name?: string;
  status?: string;
  budget_cents?: number;
  due_at?: string;
  assignments?: AssignmentInput[];
  deliverables?: DeliverableInput[];
  approvals?: ApprovalInput[];
};
```

Required UI behavior:

- campaigns page supports create, edit, advance, assignment editing, deliverable editing, and approval editing
- brief launch calls the real launch endpoint and refreshes campaign state
- clients page persists health/notes/touchpoints
- overview page uses backend analytics contracts rather than inferred mock fields

- [ ] **Step 5: Run campaign execution verification**

Run:

```bash
cd backend
go test ./... -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -run TestCampaignExecutionCrudAssignmentsDeliverablesApprovals_Integration -count=1

cd ..
npm run lint
npm run build
```

Expected:

- all commands exit `0`
- operator pages compile with no mock-only execution gaps in clients, briefs, campaigns, or overview

- [ ] **Step 6: Commit**

```bash
git add backend app lib
git commit -m "feat: complete operator campaign execution flows"
```

---

### Task 4: Launch Hardening And Deployment Readiness

**Files:**
- Modify: `README.md`
- Modify: `backend/README.md`
- Modify: `backend/internal/config/config.go`
- Modify: `backend/internal/config/config_test.go`
- Modify: `app/login/page.tsx`
- Modify: `app/signup/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/briefs/page.tsx`
- Modify: `app/dashboard/campaigns/page.tsx`
- Modify: `app/dashboard/clients/page.tsx`
- Modify: `app/dashboard/team/page.tsx`

- [ ] **Step 1: Write the failing config and smoke checks**

Add config tests like:

```go
func TestLoad_MissingResendSettingsWhenInvitesEnabled(t *testing.T) {
	t.Setenv("INVITES_ENABLED", "true")
	t.Setenv("RESEND_API_KEY", "")
	t.Setenv("EMAIL_FROM", "")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want validation error")
	}
}
```

Add a smoke checklist file section in docs for:

- owner signup
- invite send
- invite accept
- client create
- brief upload
- brief launch
- campaign update

- [ ] **Step 2: Run the focused config test to verify it fails**

Run:

```bash
cd backend
go test ./internal/config -count=1
```

Expected:

- test fails because launch env validation for invites/storage is incomplete

- [ ] **Step 3: Add launch-grade configuration validation and operator UX cleanup**

Implement config rules such as:

```go
if cfg.InvitesEnabled {
  require("RESEND_API_KEY", cfg.ResendAPIKey)
  require("EMAIL_FROM", cfg.EmailFrom)
  require("INVITE_BASE_URL", cfg.InviteBaseURL)
}

if cfg.UploadsEnabled {
  require("S3_BUCKET", cfg.S3Bucket)
  require("S3_REGION", cfg.S3Region)
  require("S3_ACCESS_KEY_ID", cfg.S3AccessKeyID)
  require("S3_SECRET_ACCESS_KEY", cfg.S3SecretAccessKey)
}
```

Required UX cleanup:

- clear empty states on clients, briefs, campaigns, team
- actionable error states instead of silent failures
- remove dead controls from non-launch-critical pages if still incomplete

- [ ] **Step 4: Update launch docs for Vercel + separate Go API host**

Document:

- required environment variables
- Postgres migration flow
- Vercel env setup for frontend
- backend env setup for Resend and S3-compatible storage
- first-operator launch smoke test sequence

- [ ] **Step 5: Run full launch verification**

Run:

```bash
cd backend
go test ./... -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -count=1

cd ..
npm run lint
npm run build
```

Expected:

- all commands exit `0`
- docs and env validation match the launch architecture

- [ ] **Step 6: Commit**

```bash
git add README.md backend app
git commit -m "chore: harden operator launch readiness"
```

---

## Self-Review

- Spec coverage:
  - operator onboarding and Resend invites are covered in Task 1
  - secure auth/session boundary is covered in Task 1 because `main` still lacks the server-owned auth layer
  - brief uploads with preview/download are covered in Task 2
  - required campaign execution scope is covered in Task 3
  - Vercel plus separate Go API launch readiness is covered in Task 4
- Placeholder scan:
  - no `TBD`, `TODO`, or deferred implementation markers remain in the plan
- Type consistency:
  - invitations live under `backend/internal/invite`
  - auth route handlers live under `app/api/auth/*`
  - dashboard operator management page lives under `app/dashboard/team/page.tsx`

