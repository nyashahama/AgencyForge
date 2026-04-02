package middleware

import (
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type rateLimitEntry struct {
	count   int
	resetAt time.Time
}

type RateLimiter struct {
	maxRequests int
	window      time.Duration
	now         func() time.Time

	mu      sync.Mutex
	entries map[string]rateLimitEntry
}

func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		maxRequests: maxRequests,
		window:      window,
		now:         time.Now,
		entries:     make(map[string]rateLimitEntry),
	}
}

func (l *RateLimiter) Middleware() func(http.Handler) http.Handler {
	if l == nil || l.maxRequests < 1 || l.window <= 0 {
		return func(next http.Handler) http.Handler { return next }
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			allowed, retryAfter := l.allow(limitKey(r))
			if !allowed {
				w.Header().Set("Retry-After", retryAfter)
				response.Error(w, http.StatusTooManyRequests, "RATE_LIMITED", "too many requests")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (l *RateLimiter) allow(key string) (bool, string) {
	now := l.now().UTC()

	l.mu.Lock()
	defer l.mu.Unlock()

	if len(l.entries) > 4096 {
		l.pruneExpiredLocked(now)
	}

	entry, ok := l.entries[key]
	if !ok || !now.Before(entry.resetAt) {
		l.entries[key] = rateLimitEntry{
			count:   1,
			resetAt: now.Add(l.window),
		}
		return true, "0"
	}

	if entry.count >= l.maxRequests {
		remaining := entry.resetAt.Sub(now).Seconds()
		return false, formatRetryAfterSeconds(remaining)
	}

	entry.count++
	l.entries[key] = entry
	return true, "0"
}

func (l *RateLimiter) pruneExpiredLocked(now time.Time) {
	for key, entry := range l.entries {
		if !now.Before(entry.resetAt) {
			delete(l.entries, key)
		}
	}
}

func limitKey(r *http.Request) string {
	return r.URL.Path + "|" + clientIP(r)
}

func clientIP(r *http.Request) string {
	if forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwarded != "" {
		first := strings.TrimSpace(strings.Split(forwarded, ",")[0])
		if first != "" {
			return first
		}
	}

	if realIP := strings.TrimSpace(r.Header.Get("X-Real-IP")); realIP != "" {
		return realIP
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}

	return strings.TrimSpace(r.RemoteAddr)
}

func formatRetryAfterSeconds(seconds float64) string {
	if seconds <= 0 {
		return "1"
	}
	return strconv.Itoa(int(math.Ceil(seconds)))
}
