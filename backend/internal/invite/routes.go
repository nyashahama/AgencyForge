package invite

import "github.com/go-chi/chi/v5"

func (h *Handler) ProtectedRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Post("/{inviteID}/resend", h.Resend)
	r.Post("/{inviteID}/revoke", h.Revoke)
	return r
}

func (h *Handler) PublicRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{token}", h.Inspect)
	r.Post("/{token}/accept", h.Accept)
	return r
}
