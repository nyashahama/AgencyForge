package workspace

import "github.com/go-chi/chi/v5"

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/playbooks", func(r chi.Router) {
		r.Get("/", h.ListPlaybooks)
		r.Post("/", h.CreatePlaybook)
		r.Get("/{playbookID}", h.GetPlaybook)
		r.Patch("/{playbookID}", h.UpdatePlaybook)
	})

	r.Get("/settings", h.GetSettings)
	r.Patch("/settings", h.UpdateSettings)
	r.Get("/activity", h.ListActivity)

	return r
}
