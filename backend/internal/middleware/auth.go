package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/nyashahama/AgencyForge/backend/internal/auth"
	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing authorization header")
				return
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid authorization header format")
				return
			}

			claims, err := auth.ValidateAccessToken(parts[1], jwtSecret)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), auth.UserIDKey, claims.Subject)
			ctx = context.WithValue(ctx, auth.EmailKey, claims.Email)
			ctx = context.WithValue(ctx, auth.AgencyIDKey, claims.AgencyID)
			ctx = context.WithValue(ctx, auth.RoleKey, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
