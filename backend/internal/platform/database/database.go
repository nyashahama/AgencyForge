package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool wraps the pgx connection pool so the sqlc-generated query layer can be
// attached here once `make generate` becomes part of the regular workflow.
type Pool struct {
	*pgxpool.Pool
}

func New(ctx context.Context, databaseURL string) (*Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}

	cfg.MaxConns = 10
	cfg.MinConns = 2
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute
	cfg.HealthCheckPeriod = time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return &Pool{Pool: pool}, nil
}

func (p *Pool) Ping(ctx context.Context) error {
	return p.Pool.Ping(ctx)
}

func InTx[T any](ctx context.Context, pool *Pool, fn func(pgx.Tx) (T, error)) (T, error) {
	var zero T

	tx, err := pool.Begin(ctx)
	if err != nil {
		return zero, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	result, err := fn(tx)
	if err != nil {
		return zero, err
	}

	if err := tx.Commit(ctx); err != nil {
		return zero, fmt.Errorf("commit transaction: %w", err)
	}

	return result, nil
}
