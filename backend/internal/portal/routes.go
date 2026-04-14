package portal

import "github.com/go-chi/chi/v5"

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{portalID}", h.Get)
	r.Patch("/{portalID}", h.Update)
	r.Post("/{portalID}/publish", h.Publish)
	return r
}
