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
	t.Setenv("AUTH_RATE_LIMIT_REQUESTS", "25")
	t.Setenv("AUTH_RATE_LIMIT_WINDOW", "2m")
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("INVITE_BASE_URL", "http://localhost:3000")
	t.Setenv("ALLOWED_ORIGINS", "http://localhost:3000,https://agencyforge.app")
	t.Setenv("EXPOSE_METRICS", "true")
	t.Setenv("TRUST_PROXY_HEADERS", "true")
	t.Setenv("RESEND_API_KEY", "resend-key")
	t.Setenv("EMAIL_FROM", "hello@agencyforge.test")

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

	if cfg.AuthRateLimitRequests != 25 {
		t.Fatalf("AuthRateLimitRequests = %d, want 25", cfg.AuthRateLimitRequests)
	}

	if cfg.AuthRateLimitWindow != 2*time.Minute {
		t.Fatalf("AuthRateLimitWindow = %v, want 2m", cfg.AuthRateLimitWindow)
	}

	if len(cfg.AllowedOrigins) != 2 {
		t.Fatalf("AllowedOrigins len = %d, want 2", len(cfg.AllowedOrigins))
	}

	if cfg.InviteBaseURL != "http://localhost:3000" {
		t.Fatalf("InviteBaseURL = %q, want http://localhost:3000", cfg.InviteBaseURL)
	}

	if cfg.ResendAPIKey != "resend-key" {
		t.Fatalf("ResendAPIKey = %q, want resend-key", cfg.ResendAPIKey)
	}

	if cfg.EmailFrom != "hello@agencyforge.test" {
		t.Fatalf("EmailFrom = %q, want hello@agencyforge.test", cfg.EmailFrom)
	}

	if !cfg.ExposeMetrics {
		t.Fatal("ExposeMetrics = false, want true")
	}

	if !cfg.TrustProxyHeaders {
		t.Fatal("TrustProxyHeaders = false, want true")
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

	if cfg.AuthRateLimitRequests != 10 {
		t.Fatalf("AuthRateLimitRequests = %d, want 10", cfg.AuthRateLimitRequests)
	}

	if cfg.AuthRateLimitWindow != time.Minute {
		t.Fatalf("AuthRateLimitWindow = %v, want 1m", cfg.AuthRateLimitWindow)
	}

	if len(cfg.AllowedOrigins) != 1 || cfg.AllowedOrigins[0] != "http://localhost:3000" {
		t.Fatalf("AllowedOrigins = %#v, want fallback app origin", cfg.AllowedOrigins)
	}

	if cfg.InviteBaseURL != "http://localhost:3000" {
		t.Fatalf("InviteBaseURL = %q, want fallback app base url", cfg.InviteBaseURL)
	}

	if cfg.ExposeMetrics {
		t.Fatal("ExposeMetrics = true, want false")
	}

	if cfg.TrustProxyHeaders {
		t.Fatal("TrustProxyHeaders = true, want false")
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

func TestLoad_InvalidAuthRateLimitRequests(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("z", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("AUTH_RATE_LIMIT_REQUESTS", "zero")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error")
	}
}

func TestLoad_InvalidAuthRateLimitWindow(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("z", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("AUTH_RATE_LIMIT_WINDOW", "0s")

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

func TestLoad_InvalidExposeMetrics(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("z", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("EXPOSE_METRICS", "definitely")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error")
	}
}

func TestLoad_InvalidTrustProxyHeaders(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://agencyforge:agencyforge@localhost:5432/agencyforge?sslmode=disable")
	t.Setenv("JWT_SECRET", strings.Repeat("z", 40))
	t.Setenv("APP_BASE_URL", "http://localhost:3000")
	t.Setenv("TRUST_PROXY_HEADERS", "sometimes")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want error")
	}
}
