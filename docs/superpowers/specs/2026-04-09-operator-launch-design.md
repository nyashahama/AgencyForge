# AgencyForge Operator-Only Launch Design

## Goal

Define the day-one launch shape for AgencyForge as an internal operator product. The launch must support owner-managed agency onboarding, role-based operator access, client management, brief intake with real file storage, and full internal campaign execution. Client-facing portal sharing is explicitly out of scope for this launch.

## Launch Decision Summary

The initial launch target is:

- internal operator use only
- required launch workflows:
  - auth and workspace setup
  - clients
  - brief intake
  - campaign execution
- owner-managed operator onboarding
- invite emails sent through Resend
- supported roles:
  - owner
  - admin
  - member
  - viewer
- brief document handling:
  - real file uploads
  - operator preview
  - operator download
- campaign execution scope:
  - assignments
  - deliverables
  - approval tracking
- deployment target:
  - Next.js on Vercel
  - separate Go API host
  - managed Postgres
- object storage:
  - S3-compatible storage

## Product Scope

### In Scope

The launch must support this end-to-end operator workflow:

1. Agency owner signs up.
2. A new agency workspace is created.
3. Owner invites additional operators by role.
4. Invited operators accept their invite and set their password.
5. Operators create and manage clients.
6. Operators create briefs and upload source documents.
7. Operators preview and download uploaded brief files.
8. Operators launch briefs into campaigns.
9. Operators execute campaigns through internal workflow management:
   - assignments
   - deliverables
   - approvals
   - status progression

### Out of Scope

The following are not required for day-one launch:

- external portal sharing
- client-facing portal review experience
- public invite flows beyond operator onboarding
- billing and subscriptions
- launch-critical dependency on docs/playbooks
- launch-critical dependency on settings polish
- launch-critical dependency on advanced analytics

## User Roles

### Owner

- full workspace access
- invite and manage operators
- assign roles
- manage all clients, briefs, campaigns, assignments, deliverables, and approvals

### Admin

- same operational authority as owner for day-to-day work
- no special ownership semantics beyond elevated internal permissions

### Member

- full day-to-day operational access for clients, briefs, campaigns, assignments, deliverables, and approvals
- cannot manage invitations or owner-only administration

### Viewer

- read-only across operator product areas
- no mutation access to clients, briefs, campaigns, assignments, deliverables, approvals, or invitations

## Launch Architecture

### Frontend

The frontend remains a Next.js application deployed on Vercel. It owns:

- marketing pages
- login and signup
- invite acceptance UI
- operator dashboard surfaces
- session cookie route handlers
- upload initiation and operator interaction flows

The frontend should remain thin. It should orchestrate operator workflows and render state, but should not own business rules.

### Backend

The Go backend remains the system of record. It owns:

- identity and session rules
- invitation lifecycle
- agency tenancy boundaries
- clients
- briefs
- campaign state
- assignments
- deliverables
- approvals
- authorization
- file access rules

All durable workflow decisions must remain backend-enforced.

### Database

Postgres remains the durable store for:

- agencies
- users
- memberships
- invitations
- clients
- briefs
- documents and document metadata
- campaigns
- assignments
- deliverables
- approvals
- activity and history records

### Email

Resend is the day-one transactional email provider. It is used for:

- operator invitation emails
- invite resend flow

The backend should integrate through a mail abstraction so development and testing do not depend on live email delivery.

### File Storage

S3-compatible object storage is the day-one file storage choice.

Why:

- clean fit for Vercel plus separate Go API hosting
- signed upload and download support
- preview and download can be controlled without routing all file bytes through the app
- portable across providers

The system should code against the S3 API, not a provider-specific SDK shape that would create unnecessary lock-in.

## Core Launch Flows

### 1. Owner Signup and Workspace Creation

Expected behavior:

- owner signs up from the public site
- backend creates:
  - agency
  - user
  - owner membership
- session is established immediately
- owner lands in the operator dashboard

### 2. Operator Invitation and Acceptance

Expected behavior:

- owner or admin opens operator management UI
- invites a user by email and role
- backend creates invitation record with secure acceptance token and expiry
- backend sends invite email through Resend
- recipient opens invite acceptance page
- recipient sets password and activates membership
- invite is consumed exactly once

Required controls:

- resend invite
- revoke invite
- prevent duplicate active invites for the same agency and email when appropriate
- validate role assignments
- validate invitation expiry

### 3. Client Management

Expected behavior:

- operators create clients
- operators update client health and notes
- operators maintain relationship context
- operators log touchpoints
- viewer can inspect but not mutate

The client surface must be real operational state, not a mock board.

### 4. Brief Intake With Real Documents

Expected behavior:

- operators create briefs for a client
- operators upload one or more source files
- uploaded files are stored in object storage
- operators can see uploaded file metadata in the dashboard
- operators can preview supported files
- operators can download files

Required backend behavior:

- store document metadata durably
- generate signed upload URLs or equivalent secure upload path
- generate signed preview/download access
- enforce agency scoping and document ownership rules
- validate allowed media types and upload constraints

### 5. Campaign Execution

Expected behavior:

- operators launch a brief into a campaign
- operators create campaigns directly when needed
- operators manage campaign status progression
- operators assign specialists or internal roles
- operators manage deliverables
- operators track approvals and approval state

Day-one campaign execution is internal only. Approval tracking is an operator workflow, not a public client experience.

## System Boundaries

### Frontend Responsibilities

- render operator-facing UI
- call session route handlers for auth state
- call backend APIs for workflow state
- render upload controls and document actions
- guard operator flows by role-aware UI affordances

### Backend Responsibilities

- validate all write permissions
- enforce tenant isolation
- own invitation and membership rules
- own campaign transition rules
- own brief launch rules
- own file authorization
- own signed URL issuance

### Shared Contract Expectations

Frontend and backend contracts must be explicit and typed. Day-one launch cannot tolerate silent mismatches between:

- dashboard DTOs
- workflow endpoints
- upload metadata models
- campaign execution forms
- invitation payloads

## Security and Reliability Requirements

Day-one launch must preserve the hardening already completed:

- backend-owned session cookies
- refresh token protection
- RBAC enforcement
- request hardening
- agency scoping on all durable state

Additional launch requirements:

- invitation tokens must be single-use and expiring
- file access must not expose raw bucket paths publicly
- preview and download access must be authorized
- Resend configuration must fail fast when enabled but incomplete
- storage configuration must fail fast when uploads are enabled but incomplete

## Launch Slices

The remaining work should be executed in this order.

### Slice 1: Identity and Operator Onboarding

Build:

- invitation persistence
- invitation sending through Resend
- invitation acceptance flow
- role-aware operator management UI

Reason for first position:

- unlocks real internal multi-user launch
- sets the final authorization model early

### Slice 2: Brief Documents

Build:

- object storage integration
- upload flow
- preview/download flow
- operator dashboard document UI

Reason for second position:

- required for real intake
- impacts data model, API contracts, and launch infrastructure

### Slice 3: Campaign Execution Completion

Build:

- fully wired campaign CRUD
- assignment management
- deliverable management
- approval management
- brief-to-campaign launch flow polish

Reason for third position:

- depends on auth, roles, and intake document flows already being real

### Slice 4: Launch Hardening

Build:

- environment validation
- production configuration docs
- smoke-path tests
- empty/loading/error state cleanup
- deployment readiness checks

Reason for final position:

- hardens the system after the core workflows are complete

## Testing Strategy

Launch work must be verified in four layers:

1. backend unit tests for invitation, authorization, storage integration boundaries, and workflow validation
2. backend integration tests for agency-scoped operational flows
3. frontend build and lint verification on every slice
4. end-to-end smoke paths for:
   - owner signup
   - invite send
   - invite accept
   - client creation
   - brief upload
   - brief launch
   - campaign execution updates

## Non-Goals for This Spec

This design intentionally does not specify:

- portal sharing UX
- public-facing approval screens
- billing architecture
- advanced reporting requirements
- post-launch product expansion

Those are separate future scopes.

