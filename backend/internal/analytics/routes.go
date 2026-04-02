package analytics

import "github.com/go-chi/chi/v5"

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/dashboard", h.GetDashboard)
	r.Get("/throughput", h.ListThroughput)
	r.Get("/specialists", h.ListSpecialists)
	return r
}
