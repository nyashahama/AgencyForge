# AgencyForge System Design

## Purpose

AgencyForge is an operating system for agencies that turns inbound client work into a managed delivery workflow. The product covers the full arc from intake to execution to client delivery:

- collect briefs and client context
- convert briefs into campaigns
- coordinate specialist work across campaign stages
- package work into client-facing portals
- track approvals, activity, settings, and performance

This document defines the complete system design for the product, the backend expectations, and the intended behavior of the end-to-end platform.

## Product Goals

AgencyForge should let an agency run a repeatable delivery process without relying on spreadsheets, ad hoc chat threads, or disconnected tools.

The system is expected to provide:

- one workspace per agency
- authenticated multi-user access with agency scoping
- durable operational state for clients, briefs, campaigns, portals, settings, playbooks, and activity
- a dashboard that shows live delivery state and performance
- a backend API that is safe, testable, and easy to extend

## Product Areas

The product is organized into these major areas:

- Marketing site
  - public landing page
  - pricing and proof points
  - conversion into signup or login
- Auth
  - register
  - login
  - refresh
  - logout
  - current user session
- Dashboard
  - overview
  - briefs
  - campaigns
  - analytics
  - clients
  - portal
  - docs
  - settings
- Backend API
  - agency-scoped domain APIs
  - analytics read models
  - middleware, security, and observability
- Database
  - normalized relational schema
  - migrations
  - history and activity records

## Primary Actors

- Agency owner
  - creates workspace
  - manages users and settings
  - oversees all accounts and delivery state
- Agency operator
  - creates clients
  - manages briefs
  - advances campaigns
  - publishes portals
- Specialist
  - works on assigned campaign slices
  - updates assignment status and deliverables
- Client approver
  - external stakeholder represented through approval records and portal sharing

## Core System Model

The core operating model is:

1. An agency is created.
2. Users belong to that agency through memberships.
3. The agency creates clients.
4. Clients submit or receive briefs.
5. Briefs are processed and optionally launched into campaigns.
6. Campaigns move through execution states with assignments, deliverables, and approvals.
7. Campaign results are exposed through portals and portal publications.
8. Workspace settings, playbooks, and activity events support governance and repeatability.
9. Analytics derive performance views from durable operational data.

## End-to-End Product Flows

### 1. Acquisition and Entry

The public site explains the value proposition and routes users into:

- `/signup`
- `/login`

Expected behavior:

- signup creates a new agency and owner account
- login resumes an existing workspace session
- public pages do not require backend auth

Current frontend note:

- the marketing and auth pages exist
- auth UI is still local-state driven on the frontend
- the backend auth system is implemented and ready to be connected

### 2. Workspace Creation

When a new user signs up:

- a new agency is created
- a new user is created
- an active owner membership is created
- access and refresh tokens are issued

Backend expectations:

- unique user emails
- agency-scoped ownership
- refresh-token rotation
- membership validation on protected flows

### 3. Client Account Management

Clients are the account boundary for delivery work.

Each client should support:

- core account record
- owner assignment
- relationship health
- revenue context
- primary and secondary contacts
- touchpoint history
- approval pressure summary

Backend expectations:

- agency-scoped CRUD
- contact upsert support
- touchpoint logging
- `last_touchpoint_at` maintenance
- activity event generation

### 4. Brief Intake

Briefs represent inbound work and source context.

Each brief should support:

- associated client
- channel
- source type
- document metadata
- processing status
- next action
- launch readiness

Flow:

1. create brief
2. attach document metadata when applicable
3. move through intake statuses
4. launch into campaign when ready

Backend expectations:

- status history is append-only
- launched briefs record `launched_at`
- client and agency validation is enforced
- launch can create downstream campaign state transactionally

### 5. Campaign Execution

Campaigns are the core execution unit.

Each campaign should support:

- originating client
- optional originating brief
- owner
- workflow status
- budget and due date
- progress and risk
- assignments
- deliverables
- approvals
- status history

Flow:

1. create campaign directly or from brief
2. assign specialist roles
3. produce deliverables
4. request approvals
5. advance workflow
6. reach approved, paused, or cancelled state

Backend expectations:

- workflow transitions are controlled
- status history is recorded on every transition
- deliverable counts are kept accurate
- approvals can be pending, approved, changes requested, or rejected
- all state is agency-scoped

### 6. Portal Delivery

Portals are the client-facing delivery layer.

Each portal should support:

- client ownership
- branded presentation
- review mode
- publication versions
- share tokens
- publication timestamps

Flow:

1. portal exists for a client
2. review flow is configured
3. content is published into a versioned publication
4. share links are issued and revoked

Backend expectations:

- portal updates are agency-scoped
- publishing writes immutable publication snapshots
- share token lifecycle is explicit
- portal activity is recorded

### 7. Workspace Meta

Workspace metadata keeps the agency operating consistently.

This includes:

- playbooks
- workspace settings
- activity feed

Playbooks:

- reusable operating instructions
- category and status aware
- owned by the workspace

Settings:

- grouped key/value workspace configuration
- default bootstrap on first access
- explicit updates with auditability

Activity:

- append-only timeline of product events
- derived from real writes, not UI-only text

### 8. Analytics

Analytics are read models built from operational data.

The dashboard should answer:

- how many campaigns are currently live
- how many reviews are due
- how many briefs are moving through the system
- which specialists are under load
- how quickly approvals happen
- how many campaigns are completing over time

Backend expectations:

- analytics read models are built from transactional tables
- no separate analytics database is required at this stage
- agency scoping is enforced

## Domain Model

### Tenancy and Auth

- `agencies`
- `users`
- `agency_memberships`
- `refresh_tokens`

### Accounts

- `clients`
- `client_contacts`
- `client_touchpoints`

### Intake

- `briefs`
- `brief_documents`
- `brief_status_history`

### Execution

- `campaigns`
- `specialists`
- `campaign_assignments`
- `campaign_status_history`
- `campaign_deliverables`
- `campaign_approvals`

### Delivery

- `portals`
- `portal_review_flows`
- `portal_publications`
- `portal_shares`

### Workspace

- `playbooks`
- `setting_groups`
- `setting_items`
- `activity_events`

## System Architecture

### Frontend

The frontend is a Next.js App Router application.

Responsibilities:

- public marketing site
- auth entry pages
- workspace shell and navigation
- dashboard views and charts
- future API integration and session handling

Current route groups:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/dashboard/briefs`
- `/dashboard/campaigns`
- `/dashboard/analytics`
- `/dashboard/clients`
- `/dashboard/portal`
- `/dashboard/docs`
- `/dashboard/settings`

Current frontend state note:

- dashboard views are still powered by mock state
- backend APIs now exist for the major operational domains
- the next frontend milestone is replacing mock state with API-backed data loading and auth session handling

### Backend

The backend is a Go HTTP API built around chi, pgx, sqlc, and goose.

Responsibilities:

- auth and session issuance
- agency-scoped CRUD and workflow operations
- transactional writes
- activity event generation
- analytics read models
- middleware, logging, and health endpoints

Implemented backend modules:

- `auth`
- `client`
- `brief`
- `campaign`
- `portal`
- `workspace`
- `analytics`

Shared backend platform modules:

- config
- middleware
- database
- request parsing
- response envelopes
- API errors
- health

### Database

PostgreSQL is the system of record.

Responsibilities:

- all durable business state
- tenant isolation through agency keys
- workflow history
- portal publication history
- activity and analytics source facts

Migration approach:

- additive SQL migrations
- schema managed by goose
- query code generated by sqlc

## Backend Expectations By Layer

### HTTP Layer

Expected behavior:

- consistent JSON response envelope
- request validation
- typed route params
- clear domain errors
- protected routes behind JWT auth
- request ID returned on every response
- auth endpoint throttling

### Service Layer

Expected behavior:

- domain orchestration
- agency ownership enforcement
- multi-table transactions where required
- activity event emission on meaningful writes
- no generic repository abstraction

### Query Layer

Expected behavior:

- sqlc-generated code from hand-written SQL
- YAGNI query policy
  - only write queries required by live backend behavior
- use SQL for joins, aggregates, and read models where it keeps services simple

### Middleware and Platform

Expected behavior:

- panic recovery
- CORS
- auth token validation
- structured request logging
- request correlation
- auth rate limiting
- health and readiness checks

## API Surface

### Public

- `GET /healthz`
- `GET /readyz`
- `GET /metrics`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Protected

- `GET /api/v1/auth/me`
- `GET|POST|PATCH /api/v1/clients`
- `GET|POST /api/v1/briefs`
- `GET|POST|PATCH /api/v1/campaigns`
- `POST /api/v1/campaigns/{campaignID}/advance`
- `GET|PATCH|POST /api/v1/portals`
- `GET|POST|PATCH /api/v1/workspace/playbooks`
- `GET|PATCH /api/v1/workspace/settings`
- `GET /api/v1/workspace/activity`
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/throughput`
- `GET /api/v1/analytics/specialists`

## Multi-Tenancy and Security Model

All operational data is agency-scoped.

Design rules:

- every domain read and write is filtered by `agency_id`
- user identity comes from validated JWT claims
- memberships gate access
- refresh tokens are persisted and rotated
- auth endpoints are rate limited
- request IDs support traceability

## Observability

Expected observability baseline:

- structured request logs
- request ID in logs and responses
- remote IP capture
- Prometheus metrics endpoint
- activity events for business-level audit trails

## Quality Requirements

The backend is expected to maintain:

- unit tests for helpers, middleware, and config
- integration tests for vertical slices
- migration smoke verification in CI
- deterministic query generation

Definition of done for backend slices:

1. migrations exist if schema changes are required
2. only necessary SQL queries are added
3. handlers and services are implemented
4. integration tests cover happy path and scoping
5. unit and integration suites pass

## Current Implementation Status

### Implemented

- persistent auth
- complete relational schema for current product scope
- clients slice
- briefs slice
- campaigns slice
- portals slice
- workspace metadata slice
- analytics read models
- request correlation and auth throttling
- backend CI migration smoke coverage

### Not Yet Integrated End to End

- frontend auth against backend tokens
- frontend dashboard data fetching against backend APIs
- external client portal consumption flow
- background jobs
- notifications
- file storage integration for brief documents and deliverables
- role-aware permissions beyond current membership gating

## Expected Next Stage

The next full-product milestone should be frontend-backend integration.

That work should include:

- shared API client in the Next.js app
- real signup/login/logout
- persisted session handling
- dashboard data fetching from backend endpoints
- replacing mock dashboard state module by module
- portal and docs pages reading from real backend state

## Repository-Level Design Summary

This repository should be understood as a single product with two layers:

- `app/` and `components/` define the customer-facing and operator-facing UI
- `backend/` defines the durable API, database model, and operational backend

The frontend owns presentation and interaction.

The backend owns:

- identity
- tenancy
- data integrity
- workflow orchestration
- history
- analytics

That separation is the main architectural rule of the system.
