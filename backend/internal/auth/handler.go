package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

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
	if err := decodeJSON(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "name, email, and password are required")
		return
	}

	session, err := h.service.Register(r.Context(), input.Name, input.Email, input.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailTaken):
			response.Error(w, http.StatusConflict, "EMAIL_TAKEN", "email is already registered")
		case errors.Is(err, ErrWeakPassword):
			response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		default:
			response.Error(w, http.StatusInternalServerError, "REGISTER_FAILED", "could not create account")
		}
		return
	}

	response.JSON(w, http.StatusCreated, session)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input loginRequest
	if err := decodeJSON(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	if strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "email and password are required")
		return
	}

	session, err := h.service.Login(r.Context(), input.Email, input.Password)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials):
			response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "email or password is incorrect")
		case errors.Is(err, ErrInactiveMembership):
			response.Error(w, http.StatusForbidden, "MEMBERSHIP_INACTIVE", "user membership is not active")
		default:
			response.Error(w, http.StatusInternalServerError, "LOGIN_FAILED", "could not complete login")
		}
		return
	}

	response.JSON(w, http.StatusOK, session)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var input refreshRequest
	if err := decodeJSON(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	if strings.TrimSpace(input.RefreshToken) == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "refresh_token is required")
		return
	}

	session, err := h.service.Refresh(r.Context(), input.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidRefreshToken), errors.Is(err, ErrExpiredRefreshToken):
			response.Error(w, http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "refresh token is invalid or expired")
		case errors.Is(err, ErrInactiveMembership):
			response.Error(w, http.StatusForbidden, "MEMBERSHIP_INACTIVE", "user membership is not active")
		default:
			response.Error(w, http.StatusInternalServerError, "REFRESH_FAILED", "could not refresh session")
		}
		return
	}

	response.JSON(w, http.StatusOK, session)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	var input logoutRequest
	if err := decodeJSON(r, &input); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	if strings.TrimSpace(input.RefreshToken) == "" {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "refresh_token is required")
		return
	}

	if err := h.service.Logout(r.Context(), input.RefreshToken); err != nil {
		response.Error(w, http.StatusInternalServerError, "LOGOUT_FAILED", "could not revoke session")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth context")
		return
	}

	user, err := h.service.CurrentUser(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrUserNotFound):
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "user no longer exists")
		case errors.Is(err, ErrInactiveMembership):
			response.Error(w, http.StatusForbidden, "MEMBERSHIP_INACTIVE", "user membership is not active")
		default:
			response.Error(w, http.StatusInternalServerError, "ME_FAILED", "could not load current user")
		}
		return
	}

	response.JSON(w, http.StatusOK, user)
}

func decodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}
