package campaign

import (
	"net/http"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "campaign listing is scaffolded but not implemented yet")
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "campaign retrieval is scaffolded but not implemented yet")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "campaign creation is scaffolded but not implemented yet")
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "campaign updates are scaffolded but not implemented yet")
}

func (h *Handler) Advance(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "NOT_IMPLEMENTED", "campaign advancement is scaffolded but not implemented yet")
}
