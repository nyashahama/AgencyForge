package server

import (
	"log/slog"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/nyashahama/AgencyForge/backend/internal/auth"
	"github.com/nyashahama/AgencyForge/backend/internal/brief"
	"github.com/nyashahama/AgencyForge/backend/internal/campaign"
	"github.com/nyashahama/AgencyForge/backend/internal/client"
	"github.com/nyashahama/AgencyForge/backend/internal/config"
	"github.com/nyashahama/AgencyForge/backend/internal/middleware"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/health"
	"github.com/nyashahama/AgencyForge/backend/internal/portal"
	"github.com/nyashahama/AgencyForge/backend/internal/workspace"
)

type Handlers struct {
	Health    *health.Handler
	Auth      *auth.Handler
	Clients   *client.Handler
	Briefs    *brief.Handler
	Campaigns *campaign.Handler
	Portals   *portal.Handler
	Workspace *workspace.Handler
}

func NewRouter(cfg *config.Config, logger *slog.Logger, h Handlers) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Recover)
	r.Use(middleware.Logger(logger))
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	r.Get("/healthz", h.Health.Healthz)
	r.Get("/readyz", h.Health.Readyz)
	r.Handle("/metrics", promhttp.Handler())

	r.Route("/api/v1", func(r chi.Router) {
		r.Mount("/auth", h.Auth.Routes())

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg.JWTSecret))
			r.Get("/auth/me", h.Auth.Me)
			r.Mount("/clients", h.Clients.Routes())
			r.Mount("/briefs", h.Briefs.Routes())
			r.Mount("/campaigns", h.Campaigns.Routes())
			r.Mount("/portals", h.Portals.Routes())
			if h.Workspace != nil {
				r.Mount("/workspace", h.Workspace.Routes())
			}
		})
	})

	return r
}
