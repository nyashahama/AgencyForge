package middleware

import (
	"net/http"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				response.Error(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "unexpected server error")
			}
		}()

		next.ServeHTTP(w, r)
	})
}
