.PHONY: run build test test-integration test-all fmt generate migrate-up migrate-down migrate-create migrate-status docker-up docker-down docker-build docker-all seed clean

run:
	go run ./cmd/server/

build:
	go build -ldflags="-s -w" -o bin/server ./cmd/server/

clean:
	rm -rf bin/

test:
	go test ./... -v

test-integration:
	go test ./tests/integration/... -v -tags=integration

test-all: test test-integration

fmt:
	gofmt -w .

generate:
	cd db && sqlc generate

migrate-up:
	goose -dir db/migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir db/migrations postgres "$(DATABASE_URL)" down

migrate-create:
	goose -dir db/migrations create $(name) sql

migrate-status:
	goose -dir db/migrations postgres "$(DATABASE_URL)" status

seed:
	@echo "Running seed script..."
	@bash scripts/seed.sh

docker-up:
	docker compose up -d postgres

docker-down:
	docker compose down

docker-build:
	docker compose build backend

docker-all:
	docker compose up --build
