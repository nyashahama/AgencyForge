package workspace

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/apierr"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authz"
	platformrequest "github.com/nyashahama/AgencyForge/backend/internal/platform/request"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListPlaybooks(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	pagination, err := platformrequest.ParsePagination(r)
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_PAGINATION", err.Error()))
		return
	}

	items, total, err := h.service.ListPlaybooks(r.Context(), principal, pagination)
	if err != nil {
		apierr.Write(w, apierr.Internal("PLAYBOOK_LIST_FAILED", "could not list playbooks", err))
		return
	}

	response.JSONList(w, http.StatusOK, items, pagination.Meta(total))
}

func (h *Handler) GetPlaybook(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	playbookID, err := platformrequest.UUIDPathParam(r, "playbookID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_PLAYBOOK_ID", "playbookID must be a valid UUID"))
		return
	}

	item, err := h.service.GetPlaybook(r.Context(), principal, playbookID)
	if err != nil {
		switch {
		case errors.Is(err, ErrPlaybookNotFound):
			apierr.Write(w, apierr.NotFound("PLAYBOOK_NOT_FOUND", "playbook not found"))
		default:
			apierr.Write(w, apierr.Internal("PLAYBOOK_GET_FAILED", "could not load playbook", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) CreatePlaybook(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	var input CreatePlaybookInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	item, err := h.service.CreatePlaybook(r.Context(), principal, input)
	if err != nil {
		switch {
		case errors.Is(err, authz.ErrForbidden):
			apierr.Write(w, apierr.Forbidden("FORBIDDEN", "insufficient permissions"))
		case errors.Is(err, ErrPlaybookNameUsed):
			apierr.Write(w, apierr.Conflict("PLAYBOOK_NAME_USED", "playbook name already exists"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("PLAYBOOK_CREATE_FAILED", "could not create playbook", err))
		}
		return
	}

	response.JSON(w, http.StatusCreated, item)
}

func (h *Handler) UpdatePlaybook(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	playbookID, err := platformrequest.UUIDPathParam(r, "playbookID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_PLAYBOOK_ID", "playbookID must be a valid UUID"))
		return
	}

	var input UpdatePlaybookInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	item, err := h.service.UpdatePlaybook(r.Context(), principal, playbookID, input)
	if err != nil {
		switch {
		case errors.Is(err, authz.ErrForbidden):
			apierr.Write(w, apierr.Forbidden("FORBIDDEN", "insufficient permissions"))
		case errors.Is(err, ErrPlaybookNotFound):
			apierr.Write(w, apierr.NotFound("PLAYBOOK_NOT_FOUND", "playbook not found"))
		case errors.Is(err, ErrPlaybookNameUsed):
			apierr.Write(w, apierr.Conflict("PLAYBOOK_NAME_USED", "playbook name already exists"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("PLAYBOOK_UPDATE_FAILED", "could not update playbook", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	items, err := h.service.GetSettings(r.Context(), principal)
	if err != nil {
		apierr.Write(w, apierr.Internal("SETTINGS_GET_FAILED", "could not load settings", err))
		return
	}

	response.JSON(w, http.StatusOK, items)
}

func (h *Handler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	var input UpdateSettingsInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	items, err := h.service.UpdateSettings(r.Context(), principal, input)
	if err != nil {
		switch {
		case errors.Is(err, authz.ErrForbidden):
			apierr.Write(w, apierr.Forbidden("FORBIDDEN", "insufficient permissions"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("SETTINGS_UPDATE_FAILED", "could not update settings", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, items)
}

func (h *Handler) ListActivity(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	limit, err := parseLimit(r)
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_LIMIT", err.Error()))
		return
	}

	items, err := h.service.ListActivity(r.Context(), principal, limit)
	if err != nil {
		apierr.Write(w, apierr.Internal("ACTIVITY_LIST_FAILED", "could not load activity feed", err))
		return
	}

	response.JSONList(w, http.StatusOK, items, response.Meta{
		Page:    1,
		PerPage: limit,
		Total:   len(items),
	})
}

func parseLimit(r *http.Request) (int, error) {
	raw := r.URL.Query().Get("limit")
	if raw == "" {
		return platformrequest.DefaultPerPage, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value < 1 {
		return 0, errors.New("limit must be a positive integer")
	}
	if value > platformrequest.MaxPerPage {
		value = platformrequest.MaxPerPage
	}
	return value, nil
}

func isValidationError(err error) bool {
	return err != nil && (errors.Is(err, ErrValidation) || strings.Contains(err.Error(), ErrValidation.Error()))
}
