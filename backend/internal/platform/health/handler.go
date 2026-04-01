package health

import (
	"context"
	"net/http"
	"time"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Checker interface {
	Ping(ctx context.Context) error
}

type Handler struct {
	db Checker
}

func New(db Checker) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	checks := map[string]string{}

	if h.db != nil {
		if err := h.db.Ping(ctx); err != nil {
			checks["database"] = err.Error()
			response.Error(w, http.StatusServiceUnavailable, "NOT_READY", "database is unhealthy")
			return
		}
		checks["database"] = "ok"
	}

	response.JSON(w, http.StatusOK, checks)
}
