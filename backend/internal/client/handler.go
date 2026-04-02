package client

import (
	"errors"
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

	clients, total, err := h.service.List(r.Context(), principal, pagination)
	if err != nil {
		apierr.Write(w, apierr.Internal("CLIENT_LIST_FAILED", "could not list clients", err))
		return
	}

	response.JSONList(w, http.StatusOK, clients, pagination.Meta(total))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	clientID, err := platformrequest.UUIDPathParam(r, "clientID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_CLIENT_ID", "clientID must be a valid UUID"))
		return
	}

	client, err := h.service.Get(r.Context(), principal, clientID)
	if err != nil {
		switch {
		case errors.Is(err, ErrClientNotFound):
			apierr.Write(w, apierr.NotFound("CLIENT_NOT_FOUND", "client not found"))
		default:
			apierr.Write(w, apierr.Internal("CLIENT_GET_FAILED", "could not load client", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, client)
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

	client, err := h.service.Create(r.Context(), principal, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrClientSlugTaken):
			apierr.Write(w, apierr.Conflict("CLIENT_SLUG_TAKEN", "client slug already exists"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("CLIENT_CREATE_FAILED", "could not create client", err))
		}
		return
	}

	response.JSON(w, http.StatusCreated, client)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	clientID, err := platformrequest.UUIDPathParam(r, "clientID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_CLIENT_ID", "clientID must be a valid UUID"))
		return
	}

	var input UpdateInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	client, err := h.service.Update(r.Context(), principal, clientID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrClientNotFound):
			apierr.Write(w, apierr.NotFound("CLIENT_NOT_FOUND", "client not found"))
		case errors.Is(err, ErrClientSlugTaken):
			apierr.Write(w, apierr.Conflict("CLIENT_SLUG_TAKEN", "client slug already exists"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("CLIENT_UPDATE_FAILED", "could not update client", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, client)
}

func isValidationError(err error) bool {
	return err != nil && (errors.Is(err, ErrValidation) || strings.Contains(err.Error(), ErrValidation.Error()))
}
