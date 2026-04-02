package analytics

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/apierr"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	days, err := parsePositiveInt(r, "days", defaultDays, maxDays)
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_DAYS", err.Error()))
		return
	}

	activityLimit, err := parsePositiveInt(r, "activity_limit", defaultActivityLimit, maxActivityLimit)
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_ACTIVITY_LIMIT", err.Error()))
		return
	}

	dashboard, err := h.service.Dashboard(r.Context(), principal, days, activityLimit)
	if err != nil {
		apierr.Write(w, apierr.Internal("ANALYTICS_DASHBOARD_FAILED", "could not load analytics dashboard", err))
		return
	}

	response.JSON(w, http.StatusOK, dashboard)
}

func (h *Handler) ListThroughput(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	days, err := parsePositiveInt(r, "days", defaultDays, maxDays)
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_DAYS", err.Error()))
		return
	}

	items, err := h.service.ListThroughput(r.Context(), principal, days)
	if err != nil {
		apierr.Write(w, apierr.Internal("ANALYTICS_THROUGHPUT_FAILED", "could not load throughput analytics", err))
		return
	}

	response.JSONList(w, http.StatusOK, items, response.Meta{
		Page:    1,
		PerPage: len(items),
		Total:   len(items),
	})
}

func (h *Handler) ListSpecialists(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	items, err := h.service.ListSpecialists(r.Context(), principal)
	if err != nil {
		apierr.Write(w, apierr.Internal("ANALYTICS_SPECIALISTS_FAILED", "could not load specialist analytics", err))
		return
	}

	response.JSONList(w, http.StatusOK, items, response.Meta{
		Page:    1,
		PerPage: len(items),
		Total:   len(items),
	})
}

func parsePositiveInt(r *http.Request, key string, defaultValue int, maxValue int) (int, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return defaultValue, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value < 1 {
		return 0, errors.New(key + " must be a positive integer")
	}
	if value > maxValue {
		value = maxValue
	}
	return value, nil
}
