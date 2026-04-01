//go:build integration

package integration

import (
	"context"
	"log/slog"
	"os"
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

	os.Exit(m.Run())
}
