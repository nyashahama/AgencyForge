package auth

import (
	"encoding/json"
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

	session, err := h.service.IssueStarterSession(input.Email)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "SESSION_ISSUE_FAILED", "could not create starter session")
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

	session, err := h.service.IssueStarterSession(input.Email)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "SESSION_ISSUE_FAILED", "could not create starter session")
		return
	}

	response.JSON(w, http.StatusOK, session)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "refresh flow will be implemented when persistent auth lands")
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth context")
		return
	}

	email, _ := r.Context().Value(EmailKey).(string)
	agencyID, _ := r.Context().Value(AgencyIDKey).(string)
	role, _ := r.Context().Value(RoleKey).(string)

	response.JSON(w, http.StatusOK, map[string]string{
		"id":        userID,
		"email":     email,
		"agency_id": agencyID,
		"role":      role,
	})
}

func decodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}
