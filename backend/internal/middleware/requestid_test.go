package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestID_GeneratesHeaderAndContext(t *testing.T) {
	var gotRequestID string

	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotRequestID = RequestIDFromContext(r.Context())
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNoContent)
	}

	headerRequestID := rec.Header().Get(RequestIDHeader)
	if headerRequestID == "" {
		t.Fatal("X-Request-ID header = empty, want generated value")
	}
	if gotRequestID != headerRequestID {
		t.Fatalf("context request_id = %q, want %q", gotRequestID, headerRequestID)
	}
}

func TestRequestID_PreservesIncomingHeader(t *testing.T) {
	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if RequestIDFromContext(r.Context()) != "req-123" {
			t.Fatalf("context request_id = %q, want req-123", RequestIDFromContext(r.Context()))
		}
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set(RequestIDHeader, "req-123")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Header().Get(RequestIDHeader) != "req-123" {
		t.Fatalf("X-Request-ID header = %q, want req-123", rec.Header().Get(RequestIDHeader))
	}
}
