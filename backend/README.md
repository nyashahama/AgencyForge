# AgencyForge Backend

Go backend starter pack for AgencyForge. This mirrors the backend shape used in `nyashahama/StrataHQ`, but stays intentionally light on domain implementation so the project can grow into the real API cleanly.

## Tech Stack

| Tool | Purpose |
| --- | --- |
| Go 1.22 | Language |
| Chi | HTTP router |
| PostgreSQL 17 | Primary database |
| pgx/v5 | Postgres driver |
| sqlc | Type-safe SQL codegen |
| goose | Database migrations |
| JWT | Authentication |
| Docker | Containerization |
| Docker Compose | Local development services |

## Quick Start

```bash
cd backend
cp .env.example .env
make docker-up
make migrate-up
make run
```

The starter server runs on `http://localhost:8080`.

Verify it with:

```bash
curl http://localhost:8080/healthz
```

## Project Structure

```text
backend/
├── cmd/server/              # Application entrypoint
├── internal/
│   ├── auth/                # JWT helpers, auth handlers, starter login flow
│   ├── brief/               # Brief domain scaffold
│   ├── campaign/            # Campaign domain scaffold
│   ├── client/              # Client domain scaffold
│   ├── config/              # Environment loading and validation
│   ├── middleware/          # Recover, logging, CORS, auth
│   ├── platform/
│   │   ├── database/        # pgx pool setup
│   │   ├── health/          # healthz and readyz
│   │   └── response/        # JSON response envelope helpers
│   ├── portal/              # Portal domain scaffold
│   └── server/              # Router and HTTP server setup
├── db/
│   ├── gen/                 # sqlc generated code lands here
│   ├── migrations/          # goose SQL migrations
│   ├── queries/             # sqlc query files
│   └── sqlc.yaml            # sqlc config
├── scripts/                 # Developer helper scripts
├── tests/
│   ├── fixtures/            # Test fixtures
│   └── integration/         # Tagged integration tests
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

## Current Scope

This starter pack intentionally includes:

- Real config loading and validation
- Real Postgres connection setup
- Real health and readiness endpoints
- Real JWT generation and auth middleware
- Starter auth endpoints suitable for wiring the frontend later
- Placeholder domain packages and routes for AgencyForge concepts
- sqlc and goose scaffolding with starter migrations and queries
- Unit tests next to packages and integration tests under `tests/integration`

This starter pack intentionally does not include:

- Full domain services
- Persistent auth flows
- Complete CRUD implementations
- Full SQL query generation output committed to `db/gen`

## Available Commands

| Command | Description |
| --- | --- |
| `make run` | Run the server locally |
| `make build` | Build `bin/server` |
| `make test` | Run unit tests |
| `make test-integration` | Run tagged integration tests |
| `make test-all` | Run all tests |
| `make fmt` | Format Go files |
| `make generate` | Generate sqlc code |
| `make migrate-up` | Run pending migrations |
| `make migrate-down` | Roll back last migration |
| `make migrate-create name=<name>` | Create a new migration |
| `make migrate-status` | Show migration status |
| `make docker-up` | Start Postgres |
| `make docker-down` | Stop local containers |

## Starter Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/healthz` | No | Liveness probe |
| `GET` | `/readyz` | No | Readiness probe |
| `GET` | `/metrics` | No | Prometheus metrics |
| `POST` | `/api/v1/auth/register` | No | Starter registration session issuance |
| `POST` | `/api/v1/auth/login` | No | Starter login session issuance |
| `POST` | `/api/v1/auth/refresh` | No | Reserved for future refresh flow |
| `POST` | `/api/v1/auth/logout` | No | Reserved for future logout flow |
| `GET` | `/api/v1/auth/me` | Yes | Current token claims |
| `GET` | `/api/v1/clients` | Yes | Client domain scaffold |
| `GET` | `/api/v1/briefs` | Yes | Brief domain scaffold |
| `GET` | `/api/v1/campaigns` | Yes | Campaign domain scaffold |
| `GET` | `/api/v1/portals` | Yes | Portal domain scaffold |

## Notes

- The backend structure is deliberately modeled after the `StrataHQ` backend layout.
- `db/gen` is reserved for generated sqlc output and should be populated with `make generate`.
- Because the local environment in this repo is Go 1.22, the starter pack targets Go 1.22 instead of the newer version used in `StrataHQ`.
