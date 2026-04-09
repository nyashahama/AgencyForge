package invite

import (
	"errors"
	"net/http"

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	items, err := h.service.List(r.Context(), principal)
	if err != nil {
		apierr.Write(w, mapInviteError("INVITE_LIST_FAILED", "could not list invites", err))
		return
	}

	response.JSON(w, http.StatusOK, items)
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
		apierr.Write(w, mapInviteError("INVITE_CREATE_FAILED", "could not create invite", err))
		return
	}

	response.JSON(w, http.StatusCreated, item)
}

func (h *Handler) Resend(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	inviteID, err := platformrequest.UUIDPathParam(r, "inviteID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_INVITE_ID", "inviteID must be a valid UUID"))
		return
	}

	item, err := h.service.Resend(r.Context(), principal, inviteID)
	if err != nil {
		apierr.Write(w, mapInviteError("INVITE_RESEND_FAILED", "could not resend invite", err))
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) Revoke(w http.ResponseWriter, r *http.Request) {
	principal, err := authctx.FromContext(r.Context())
	if err != nil {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	inviteID, err := platformrequest.UUIDPathParam(r, "inviteID")
	if err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_INVITE_ID", "inviteID must be a valid UUID"))
		return
	}

	if err := h.service.Revoke(r.Context(), principal, inviteID); err != nil {
		apierr.Write(w, mapInviteError("INVITE_REVOKE_FAILED", "could not revoke invite", err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Inspect(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	item, err := h.service.Inspect(r.Context(), token)
	if err != nil {
		apierr.Write(w, mapInviteError("INVITE_GET_FAILED", "could not load invite", err))
		return
	}

	response.JSON(w, http.StatusOK, item)
}

func (h *Handler) Accept(w http.ResponseWriter, r *http.Request) {
	var input AcceptInput
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	token := r.PathValue("token")
	session, err := h.service.Accept(r.Context(), token, input)
	if err != nil {
		apierr.Write(w, mapInviteError("INVITE_ACCEPT_FAILED", "could not accept invite", err))
		return
	}

	response.JSON(w, http.StatusOK, session)
}

func mapInviteError(code string, message string, err error) error {
	switch {
	case errors.Is(err, authctx.ErrMissingPrincipal):
		return apierr.Unauthorized("UNAUTHORIZED", "missing auth context")
	case errors.Is(err, ErrInvalidEmail), errors.Is(err, ErrInvalidRole), errors.Is(err, ErrInvalidName), errors.Is(err, ErrWeakPassword):
		return apierr.Invalid("VALIDATION_ERROR", err.Error())
	case errors.Is(err, authz.ErrForbidden):
		return apierr.Forbidden("FORBIDDEN", "insufficient permissions")
	case errors.Is(err, ErrInviteNotFound):
		return apierr.NotFound("INVITE_NOT_FOUND", "invite not found")
	case errors.Is(err, ErrInviteAlreadyActive), errors.Is(err, ErrInviteEmailUsed), errors.Is(err, ErrInviteAccepted):
		return apierr.Conflict("INVITE_CONFLICT", err.Error())
	case errors.Is(err, ErrInviteExpired), errors.Is(err, ErrInviteRevoked):
		return apierr.New(http.StatusGone, "INVITE_UNAVAILABLE", err.Error())
	default:
		return apierr.Internal(code, message, err)
	}
}
