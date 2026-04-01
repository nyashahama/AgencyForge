package client

import "github.com/go-chi/chi/v5"

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{clientID}", h.Get)
	r.Patch("/{clientID}", h.Update)
	return r
}
