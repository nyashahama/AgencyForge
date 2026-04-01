package brief

import "github.com/go-chi/chi/v5"

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{briefID}", h.Get)
	r.Post("/{briefID}/launch", h.Launch)
	return r
}
