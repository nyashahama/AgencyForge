package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/joho/godotenv"

	"github.com/nyashahama/AgencyForge/backend/internal/analytics"
	"github.com/nyashahama/AgencyForge/backend/internal/auth"
	"github.com/nyashahama/AgencyForge/backend/internal/brief"
	"github.com/nyashahama/AgencyForge/backend/internal/campaign"
	"github.com/nyashahama/AgencyForge/backend/internal/client"
	"github.com/nyashahama/AgencyForge/backend/internal/config"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/database"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/health"
	"github.com/nyashahama/AgencyForge/backend/internal/portal"
	"github.com/nyashahama/AgencyForge/backend/internal/server"
	"github.com/nyashahama/AgencyForge/backend/internal/workspace"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()

	db, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	authService := auth.NewService(db, cfg.JWTSecret, cfg.JWTExpiry, cfg.RefreshExpiry)
	analyticsService := analytics.NewService(db)
	clientService := client.NewService(db)
	briefService := brief.NewService(db)
	campaignService := campaign.NewService(db)
	portalService := portal.NewService(db)
	workspaceService := workspace.NewService(db)

	handlers := server.Handlers{
		Health:    health.New(db),
		Auth:      auth.NewHandler(authService),
		Analytics: analytics.NewHandler(analyticsService),
		Clients:   client.NewHandler(clientService),
		Briefs:    brief.NewHandler(briefService),
		Campaigns: campaign.NewHandler(campaignService),
		Portals:   portal.NewHandler(portalService),
		Workspace: workspace.NewHandler(workspaceService),
	}

	router := server.NewRouter(cfg, logger, handlers)
	srv := server.New(router, cfg.Port, logger)

	logger.Info("starting server", "port", cfg.Port, "env", cfg.Env)
	if err := srv.Start(); err != nil {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}

	logger.Info("server stopped")
}
