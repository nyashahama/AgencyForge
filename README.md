# AgencyForge

AgencyForge is an agency operations platform. It combines a Next.js product surface with a Go backend and PostgreSQL database to manage the full workflow from client intake to campaign execution to portal delivery and analytics.

## What It Includes

- public marketing site
- signup and login entry pages
- operator dashboard for briefs, campaigns, clients, portals, docs, settings, and analytics
- Go backend with persistent auth and agency-scoped domain APIs
- PostgreSQL schema with workflow history, activity events, and analytics source tables

## Current State

The backend is substantially implemented:

- auth
- clients
- briefs
- campaigns
- portals
- workspace metadata
- analytics
- request hardening and CI verification

The frontend product shell exists across the main dashboard areas, but much of the dashboard still uses mock state. The next major step is wiring the Next.js app to the backend APIs and replacing mock data with real fetch flows.

## Docs

- Full system design: [DESIGN.md](/home/nyasha-hama/projects/agencyforge/DESIGN.md)
- Backend details: [backend/README.md](/home/nyasha-hama/projects/agencyforge/backend/README.md)

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend

- Go
- chi
- PostgreSQL
- pgx
- sqlc
- goose

## Repository Layout

```text
.
├── app/                    # Next.js routes and dashboard pages
├── components/             # Shared frontend UI
├── lib/                    # Frontend helpers
├── backend/
│   ├── cmd/server/         # Go server entrypoint
│   ├── db/                 # Migrations, SQL queries, generated sqlc code
│   ├── internal/           # Backend modules and platform code
│   ├── scripts/            # Backend helper scripts
│   └── tests/              # Integration tests
├── DESIGN.md               # Full product and system design
└── README.md
```

## Frontend Routes

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

## Backend API Areas

- auth
- clients
- briefs
- campaigns
- portals
- workspace
- analytics

Health and ops endpoints:

- `/healthz`
- `/readyz`
- `/metrics`

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Backend

```bash
cd backend
cp .env.example .env
make docker-up
make migrate-up
make run
```

Backend runs on `http://localhost:8080`.

## Useful Commands

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`

### Backend

- `make run`
- `make build`
- `make test`
- `make test-integration`
- `make test-all`
- `make generate`
- `make migrate-up`
- `make migrate-down`
- `make docker-up`
- `make docker-down`

## Testing

Backend verification:

```bash
cd backend
go test ./... -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -count=1 -v
```

## Design Principles

- agency-scoped data ownership everywhere
- backend owns durable state and workflow integrity
- frontend owns presentation and operator experience
- SQL is written only when needed by live behavior
- vertical slices are preferred over speculative abstractions

## Expected Next Step

Connect the Next.js dashboard and auth pages to the implemented backend API so the product runs end to end on real data rather than mock dashboard state.
