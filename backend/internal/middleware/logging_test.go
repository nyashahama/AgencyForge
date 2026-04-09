package middleware

import (
	"bytes"
	"context"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLogger_IncludesRequestID(t *testing.T) {
	var buffer bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&buffer, nil))

	handler := Logger(logger, false)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.RemoteAddr = "203.0.113.5:4321"
	req = req.WithContext(context.WithValue(req.Context(), requestIDContextKey{}, "req-789"))
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	output := buffer.String()
	if !strings.Contains(output, "request_id=req-789") {
		t.Fatalf("log output = %q, want request_id field", output)
	}
	if !strings.Contains(output, "remote_ip=203.0.113.5") {
		t.Fatalf("log output = %q, want remote_ip field", output)
	}
}
