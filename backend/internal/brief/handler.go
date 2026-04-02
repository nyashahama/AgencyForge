package brief

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/apierr"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/authctx"
	platformrequest "github.com/nyashahama/AgencyForge/backend/internal/platform/request"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
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

	items, total, err := h.service.List(r.Context(), principal, pagination)
	if err != nil {
		apierr.Write(w, apierr.Internal("BRIEF_LIST_FAILED", "could not list briefs", err))
		return
	}

	response.JSONList(w, http.StatusOK, items, pagination.Meta(total))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	briefID, err := platformrequest.UUIDPathParam(r, "briefID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_BRIEF_ID", "briefID must be a valid UUID"))
		return
	}

	brief, err := h.service.Get(r.Context(), principal, briefID)
	if err != nil {
		switch {
		case errors.Is(err, ErrBriefNotFound):
			apierr.Write(w, apierr.NotFound("BRIEF_NOT_FOUND", "brief not found"))
		default:
			apierr.Write(w, apierr.Internal("BRIEF_GET_FAILED", "could not load brief", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, brief)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	var input CreateInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	brief, err := h.service.Create(r.Context(), principal, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrClientNotFound):
			apierr.Write(w, apierr.NotFound("CLIENT_NOT_FOUND", "client not found"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("BRIEF_CREATE_FAILED", "could not create brief", err))
		}
		return
	}

	response.JSON(w, http.StatusCreated, brief)
}

func (h *Handler) Launch(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	briefID, err := platformrequest.UUIDPathParam(r, "briefID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_BRIEF_ID", "briefID must be a valid UUID"))
		return
	}

	var input LaunchInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil && !errors.Is(err, io.EOF) {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	result, err := h.service.Launch(r.Context(), principal, briefID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrBriefNotFound):
			apierr.Write(w, apierr.NotFound("BRIEF_NOT_FOUND", "brief not found"))
		case errors.Is(err, ErrBriefAlreadyLaunched):
			apierr.Write(w, apierr.Conflict("BRIEF_ALREADY_LAUNCHED", "brief has already been launched"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("BRIEF_LAUNCH_FAILED", "could not launch brief", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, result)
}

func isValidationError(err error) bool {
	return err != nil && (errors.Is(err, ErrValidation) || strings.Contains(err.Error(), ErrValidation.Error()))
}
