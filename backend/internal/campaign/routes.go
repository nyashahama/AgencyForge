package campaign

import "github.com/go-chi/chi/v5"

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{campaignID}", h.Get)
	r.Patch("/{campaignID}", h.Update)
	r.Post("/{campaignID}/advance", h.Advance)
	return r
}
