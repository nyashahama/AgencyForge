package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port                  string
	Env                   string
	DatabaseURL           string
	JWTSecret             string
	AllowedOrigins        []string
	JWTExpiry             time.Duration
	RefreshExpiry         time.Duration
	AppBaseURL            string
	AuthRateLimitRequests int
	AuthRateLimitWindow   time.Duration
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		Env:         getEnv("ENV", "development"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		AppBaseURL:  getEnv("APP_BASE_URL", "http://localhost:3000"),
	}

	var err error
	cfg.JWTExpiry, err = parseDuration("JWT_EXPIRY", 15*time.Minute)
	if err != nil {
		return nil, err
	}

	cfg.RefreshExpiry, err = parseDuration("REFRESH_EXPIRY", 168*time.Hour)
	if err != nil {
		return nil, err
	}

	cfg.AuthRateLimitRequests, err = parsePositiveInt("AUTH_RATE_LIMIT_REQUESTS", 10)
	if err != nil {
		return nil, err
	}

	cfg.AuthRateLimitWindow, err = parseDuration("AUTH_RATE_LIMIT_WINDOW", time.Minute)
	if err != nil {
		return nil, err
	}

	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		cfg.AllowedOrigins = []string{cfg.AppBaseURL}
	} else {
		cfg.AllowedOrigins = strings.Split(origins, ",")
		for i := range cfg.AllowedOrigins {
			cfg.AllowedOrigins[i] = strings.TrimSpace(cfg.AllowedOrigins[i])
		}
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	required := map[string]string{
		"DATABASE_URL": c.DatabaseURL,
		"JWT_SECRET":   c.JWTSecret,
		"APP_BASE_URL": c.AppBaseURL,
	}

	var missing []string
	for name, value := range required {
		if value == "" {
			missing = append(missing, name)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 characters long")
	}

	if c.AuthRateLimitRequests < 1 {
		return fmt.Errorf("AUTH_RATE_LIMIT_REQUESTS must be greater than 0")
	}

	if c.AuthRateLimitWindow <= 0 {
		return fmt.Errorf("AUTH_RATE_LIMIT_WINDOW must be greater than 0")
	}

	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func parseDuration(key string, fallback time.Duration) (time.Duration, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("invalid duration for %s: %w", key, err)
	}

	return duration, nil
}

func parsePositiveInt(key string, fallback int) (int, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("invalid integer for %s: %w", key, err)
	}
	if parsed < 1 {
		return 0, fmt.Errorf("%s must be greater than 0", key)
	}

	return parsed, nil
}
