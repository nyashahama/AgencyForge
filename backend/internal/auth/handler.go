package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/apierr"
	platformrequest "github.com/nyashahama/AgencyForge/backend/internal/platform/request"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var input registerRequest
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", "name, email, and password are required"))
		return
	}

	session, err := h.service.Register(r.Context(), input.Name, input.Email, input.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailTaken):
			apierr.Write(w, apierr.Conflict("EMAIL_TAKEN", "email is already registered"))
		case errors.Is(err, ErrWeakPassword):
			apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", err.Error()))
		default:
			apierr.Write(w, apierr.Internal("REGISTER_FAILED", "could not create account", err))
		}
		return
	}

	response.JSON(w, http.StatusCreated, session)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input loginRequest
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	if strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", "email and password are required"))
		return
	}

	session, err := h.service.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials):
			apierr.Write(w, apierr.Unauthorized("INVALID_CREDENTIALS", "email or password is incorrect"))
		case errors.Is(err, ErrInactiveMembership):
			apierr.Write(w, apierr.Forbidden("MEMBERSHIP_INACTIVE", "user membership is not active"))
		default:
			apierr.Write(w, apierr.Internal("LOGIN_FAILED", "could not complete login", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, session)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var input refreshRequest
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	if strings.TrimSpace(input.RefreshToken) == "" {
		apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", "refresh_token is required"))
		return
	}

	session, err := h.service.Refresh(r.Context(), input.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidRefreshToken), errors.Is(err, ErrExpiredRefreshToken):
			apierr.Write(w, apierr.Unauthorized("INVALID_REFRESH_TOKEN", "refresh token is invalid or expired"))
		case errors.Is(err, ErrInactiveMembership):
			apierr.Write(w, apierr.Forbidden("MEMBERSHIP_INACTIVE", "user membership is not active"))
		default:
			apierr.Write(w, apierr.Internal("REFRESH_FAILED", "could not refresh session", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, session)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var input logoutRequest
	if err := platformrequest.DecodeJSON(r, &input); err != nil {
		apierr.Write(w, apierr.Invalid("INVALID_JSON", err.Error()))
		return
	}

	if strings.TrimSpace(input.RefreshToken) == "" {
		apierr.Write(w, apierr.Invalid("VALIDATION_ERROR", "refresh_token is required"))
		return
	}

	if err := h.service.Logout(r.Context(), input.RefreshToken); err != nil {
		apierr.Write(w, apierr.Internal("LOGOUT_FAILED", "could not revoke session", err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "missing auth context"))
		return
	}

	user, err := h.service.CurrentUser(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			apierr.Write(w, apierr.Unauthorized("UNAUTHORIZED", "user no longer exists"))
		case errors.Is(err, ErrInactiveMembership):
			apierr.Write(w, apierr.Forbidden("MEMBERSHIP_INACTIVE", "user membership is not active"))
		default:
			apierr.Write(w, apierr.Internal("ME_FAILED", "could not load current user", err))
		}
		return
	}

	response.JSON(w, http.StatusOK, user)
}
