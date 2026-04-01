package config

import (
	"strings"
	"testing"
	"time"
)

func TestLoad_AllFieldsSet(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("x", 40))
	t.Setenv("JWT_EXPIRY", "30m")
	t.Setenv("REFRESH_EXPIRY", "72h")
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("ALLOWED_ORIGINS", "http://localhost:3000,https://agencyforge.app")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Port != "9090" {
		t.Fatalf("Port = %q, want 9090", cfg.Port)
	}

	if cfg.Env != "production" {
		t.Fatalf("Env = %q, want production", cfg.Env)
	}

	if cfg.JWTExpiry != 30*time.Minute {
		t.Fatalf("JWTExpiry = %v, want 30m", cfg.JWTExpiry)
	}

	if cfg.RefreshExpiry != 72*time.Hour {
		t.Fatalf("RefreshExpiry = %v, want 72h", cfg.RefreshExpiry)
	}

	if len(cfg.AllowedOrigins) != 2 {
		t.Fatalf("AllowedOrigins len = %d, want 2", len(cfg.AllowedOrigins))
	}
}

func TestLoad_Defaults(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("y", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Port != "8080" {
		t.Fatalf("Port = %q, want 8080", cfg.Port)
	}

	if cfg.Env != "development" {
		t.Fatalf("Env = %q, want development", cfg.Env)
	}

	if cfg.JWTExpiry != 15*time.Minute {
		t.Fatalf("JWTExpiry = %v, want 15m", cfg.JWTExpiry)
	}

	if cfg.RefreshExpiry != 168*time.Hour {
		t.Fatalf("RefreshExpiry = %v, want 168h", cfg.RefreshExpiry)
	}

	if len(cfg.AllowedOrigins) != 1 || cfg.AllowedOrigins[0] != "http://localhost:3000" {
		t.Fatalf("AllowedOrigins = %#v, want fallback app origin", cfg.AllowedOrigins)
	}
}

func TestLoad_InvalidDuration(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("z", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("JWT_EXPIRY", "bad-duration")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error")
	}
}

func TestLoad_ShortJWTSecret(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", "short-secret")
	t.Setenv("APP_BASE_URL", "http://localhost:3000")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error")
	}
}
