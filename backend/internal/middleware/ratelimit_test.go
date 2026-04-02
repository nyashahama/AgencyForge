package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter_BlocksAfterLimit(t *testing.T) {
	limiter := NewRateLimiter(2, time.Minute)
	limiter.now = func() time.Time {
		return time.Date(2026, time.April, 2, 12, 0, 0, 0, time.UTC)
	}

	calls := 0
	handler := limiter.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.WriteHeader(http.StatusNoContent)
	}))

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
		req.RemoteAddr = "203.0.113.10:4123"
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("request %d status = %d, want %d", i+1, rec.Code, http.StatusNoContent)
		}
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	req.RemoteAddr = "203.0.113.10:4123"
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusTooManyRequests)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Fatal("Retry-After header = empty, want retry interval")
	}
	if calls != 2 {
		t.Fatalf("handler calls = %d, want 2", calls)
	}
}

func TestRateLimiter_IsolatedByPathAndClientIP(t *testing.T) {
	limiter := NewRateLimiter(1, time.Minute)
	limiter.now = func() time.Time {
		return time.Date(2026, time.April, 2, 12, 0, 0, 0, time.UTC)
	}

	handler := limiter.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	first := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	first.RemoteAddr = "203.0.113.10:4123"
	firstRec := httptest.NewRecorder()
	handler.ServeHTTP(firstRec, first)

	second := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", nil)
	second.RemoteAddr = "203.0.113.10:4123"
	secondRec := httptest.NewRecorder()
	handler.ServeHTTP(secondRec, second)

	third := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	third.RemoteAddr = "203.0.113.11:4123"
	thirdRec := httptest.NewRecorder()
	handler.ServeHTTP(thirdRec, third)

	if firstRec.Code != http.StatusNoContent {
		t.Fatalf("first status = %d, want %d", firstRec.Code, http.StatusNoContent)
	}
	if secondRec.Code != http.StatusNoContent {
		t.Fatalf("second status = %d, want %d", secondRec.Code, http.StatusNoContent)
	}
	if thirdRec.Code != http.StatusNoContent {
		t.Fatalf("third status = %d, want %d", thirdRec.Code, http.StatusNoContent)
	}
}
