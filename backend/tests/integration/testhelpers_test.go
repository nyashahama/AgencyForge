//go:build integration

package integration

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	testDB  *pgxpool.Pool
	testLog *slog.Logger
)

func TestMain(m *testing.M) {
	ctx := context.Background()

	testLog = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable"
	}

	var err error
	testDB, err = pgxpool.New(ctx, dbURL)
	if err != nil {
		testLog.Error("failed to connect to test database", "error", err)
		os.Exit(1)
	}
	defer testDB.Close()

	if err := ensureSchema(ctx); err != nil {
		testLog.Error("failed to prepare integration schema", "error", err)
		os.Exit(1)
	}

	os.Exit(m.Run())
}

func ensureSchema(ctx context.Context) error {
	var exists bool
	err := testDB.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.tables
			WHERE table_schema = 'public'
			  AND table_name = 'agencies'
		)
	`).Scan(&exists)
	if err != nil {
		return fmt.Errorf("check schema existence: %w", err)
	}
	if exists {
		return nil
	}

	return applyMigrations(ctx)
}

func applyMigrations(ctx context.Context) error {
	migrationDir, err := migrationDir()
	if err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationDir)
	if err != nil {
		return fmt.Errorf("read migration dir: %w", err)
	}

	var files []string
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		files = append(files, filepath.Join(migrationDir, entry.Name()))
	}
	sort.Strings(files)

	for _, path := range files {
		statements, err := parseUpStatements(path)
		if err != nil {
			return fmt.Errorf("parse migration %s: %w", filepath.Base(path), err)
		}

		for _, statement := range statements {
			if strings.TrimSpace(statement) == "" {
				continue
			}
			if _, err := testDB.Exec(ctx, statement); err != nil {
				return fmt.Errorf("apply migration %s: %w", filepath.Base(path), err)
			}
		}
	}

	return nil
}

func migrationDir() (string, error) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("resolve runtime caller")
	}

	dir := filepath.Join(filepath.Dir(filename), "..", "..", "db", "migrations")
	return filepath.Clean(dir), nil
}

func parseUpStatements(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open migration: %w", err)
	}
	defer file.Close()

	var (
		statements    []string
		builder       strings.Builder
		inUp          bool
		inStatement   bool
	)

	flush := func() {
		statement := strings.TrimSpace(builder.String())
		if statement != "" {
			statements = append(statements, statement)
		}
		builder.Reset()
	}

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		switch trimmed {
		case "-- +goose Up":
			inUp = true
			continue
		case "-- +goose Down":
			flush()
			inUp = false
			continue
		case "-- +goose StatementBegin":
			if inUp {
				inStatement = true
			}
			continue
		case "-- +goose StatementEnd":
			if inUp {
				flush()
				inStatement = false
			}
			continue
		}

		if !inUp {
			continue
		}

		if strings.HasPrefix(trimmed, "-- +goose ") {
			continue
		}

		builder.WriteString(line)
		builder.WriteByte('\n')

		if !inStatement && strings.Contains(trimmed, ";") {
			flush()
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan migration: %w", err)
	}

	flush()
	return statements, nil
}
