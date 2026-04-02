# AgencyForge Backend

The backend is the durable API and workflow engine for AgencyForge. It owns auth, tenancy, operational writes, analytics read models, and the PostgreSQL schema.

## Stack

- Go
- chi
- PostgreSQL 17
- pgx/v5
- sqlc
- goose
- JWT

## Implemented Domains

- auth
- clients
- briefs
- campaigns
- portals
- workspace metadata
- analytics

## Project Layout

```text
backend/
├── cmd/server/          # Server entrypoint
├── db/
│   ├── gen/             # Generated sqlc code
│   ├── migrations/      # Goose migrations
│   ├── queries/         # Hand-written SQL query files
│   └── sqlc.yaml
├── internal/
│   ├── analytics/
│   ├── auth/
│   ├── brief/
│   ├── campaign/
│   ├── client/
│   ├── config/
│   ├── middleware/
│   ├── platform/
│   ├── portal/
│   ├── server/
│   └── workspace/
├── scripts/
└── tests/integration/
```

## Local Development

```bash
cd backend
cp .env.example .env
make docker-up
make migrate-up
make run
```

Server:

- `http://localhost:8080`

## Main Commands

- `make run`
- `make build`
- `make test`
- `make test-integration`
- `make test-all`
- `make fmt`
- `make generate`
- `make migrate-up`
- `make migrate-down`
- `make migrate-status`
- `make docker-up`
- `make docker-down`

## API Surface

### Public

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /healthz`
- `GET /readyz`
- `GET /metrics`

### Protected

- `GET /api/v1/auth/me`
- clients
- briefs
- campaigns
- portals
- workspace
- analytics

## Backend Design Rules

- all durable business state lives in Postgres
- all operational access is agency-scoped
- services own orchestration and transaction boundaries
- SQL is added only for live backend behavior
- activity events are written for meaningful state changes
- integration tests define slice-level correctness

## Testing

```bash
go test ./... -count=1
DATABASE_URL=postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable go test ./tests/integration/... -tags=integration -count=1 -v
```

## Related Docs

- Root overview: [../README.md](/home/nyasha-hama/projects/agencyforge/README.md)
- Full system design: [../DESIGN.md](/home/nyasha-hama/projects/agencyforge/DESIGN.md)
