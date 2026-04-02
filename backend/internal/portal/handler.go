package portal

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
		apierr.Write(w, apierr.Internal("PORTAL_LIST_FAILED", "could not list portals", err))
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

	portalID, err := platformrequest.UUIDPathParam(r, "portalID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_PORTAL_ID", "portalID must be a valid UUID"))
		return
	}

	item, err := h.service.Get(r.Context(), principal, portalID)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortalNotFound):
			apierr.Write(w, apierr.NotFound("PORTAL_NOT_FOUND", "portal not found"))
		default:
			apierr.Write(w, apierr.Internal("PORTAL_GET_FAILED", "could not load portal", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	portalID, err := platformrequest.UUIDPathParam(r, "portalID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_PORTAL_ID", "portalID must be a valid UUID"))
		return
	}

	var input UpdateInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	item, err := h.service.Update(r.Context(), principal, portalID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortalNotFound):
			apierr.Write(w, apierr.NotFound("PORTAL_NOT_FOUND", "portal not found"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("PORTAL_UPDATE_FAILED", "could not update portal", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) Publish(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	portalID, err := platformrequest.UUIDPathParam(r, "portalID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_PORTAL_ID", "portalID must be a valid UUID"))
		return
	}

	var input PublishInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil && !errors.Is(err, io.EOF) {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	item, err := h.service.Publish(r.Context(), principal, portalID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrPortalNotFound):
			apierr.Write(w, apierr.NotFound("PORTAL_NOT_FOUND", "portal not found"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("PORTAL_PUBLISH_FAILED", "could not publish portal", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func isValidationError(err error) bool {
	return err != nil && (errors.Is(err, ErrValidation) || strings.Contains(err.Error(), ErrValidation.Error()))
}
