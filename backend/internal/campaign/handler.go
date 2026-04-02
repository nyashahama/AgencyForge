package campaign

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
		apierr.Write(w, apierr.Internal("CAMPAIGN_LIST_FAILED", "could not list campaigns", err))
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

	campaignID, err := platformrequest.UUIDPathParam(r, "campaignID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_CAMPAIGN_ID", "campaignID must be a valid UUID"))
		return
	}

	item, err := h.service.Get(r.Context(), principal, campaignID)
	if err != nil {
		switch {
		case errors.Is(err, ErrCampaignNotFound):
			apierr.Write(w, apierr.NotFound("CAMPAIGN_NOT_FOUND", "campaign not found"))
		default:
			apierr.Write(w, apierr.Internal("CAMPAIGN_GET_FAILED", "could not load campaign", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
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

	item, err := h.service.Create(r.Context(), principal, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrClientNotFound):
			apierr.Write(w, apierr.NotFound("CLIENT_NOT_FOUND", "client not found"))
		case errors.Is(err, ErrBriefNotFound):
			apierr.Write(w, apierr.NotFound("BRIEF_NOT_FOUND", "brief not found"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("CAMPAIGN_CREATE_FAILED", "could not create campaign", err))
		}
		return
	}

	response.JSON(w, http.StatusCreated, item)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	campaignID, err := platformrequest.UUIDPathParam(r, "campaignID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_CAMPAIGN_ID", "campaignID must be a valid UUID"))
		return
	}

	var input UpdateInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	item, err := h.service.Update(r.Context(), principal, campaignID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrCampaignNotFound):
			apierr.Write(w, apierr.NotFound("CAMPAIGN_NOT_FOUND", "campaign not found"))
		case errors.Is(err, ErrClientNotFound):
			apierr.Write(w, apierr.NotFound("CLIENT_NOT_FOUND", "client not found"))
		case errors.Is(err, ErrBriefNotFound):
			apierr.Write(w, apierr.NotFound("BRIEF_NOT_FOUND", "brief not found"))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("CAMPAIGN_UPDATE_FAILED", "could not update campaign", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) Advance(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	campaignID, err := platformrequest.UUIDPathParam(r, "campaignID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_CAMPAIGN_ID", "campaignID must be a valid UUID"))
		return
	}

	var input AdvanceInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil && !errors.Is(err, io.EOF) {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	item, err := h.service.Advance(r.Context(), principal, campaignID, input)
	if err != nil {
		switch {
		case errors.Is(err, ErrCampaignNotFound):
			apierr.Write(w, apierr.NotFound("CAMPAIGN_NOT_FOUND", "campaign not found"))
		case errors.Is(err, ErrInvalidTransition):
			apierr.Write(w, apierr.Conflict("INVALID_CAMPAIGN_TRANSITION", err.Error()))
		case isValidationError(err):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("CAMPAIGN_ADVANCE_FAILED", "could not advance campaign", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func isValidationError(err error) bool {
	return err != nil && (errors.Is(err, ErrValidation) || strings.Contains(err.Error(), ErrValidation.Error()))
}
