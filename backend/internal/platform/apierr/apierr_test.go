package apierr

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAs(t *testing.T) {
	base := errors.New("boom")
	err := Wrap(http.StatusConflict, "CONFLICT", "already exists", base)

	apiErr, ok := As(err)
	if !ok {
		t.Fatal("As() = false, want true")
	}

	if apiErr.Status != http.StatusConflict {
		t.Fatalf("Status = %d, want %d", apiErr.Status, http.StatusConflict)
	}
}

func TestWrite(t *testing.T) {
	rec := httptest.NewRecorder()

	Write(rec, Invalid("BAD_INPUT", "invalid payload"))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var payload map[string]map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if payload["error"]["code"] != "BAD_INPUT" {
		t.Fatalf("code = %q, want BAD_INPUT", payload["error"]["code"])
	}
}

func TestWriteFallback(t *testing.T) {
	rec := httptest.NewRecorder()

	Write(rec, errors.New("unexpected"))

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusInternalServerError)
	}
}
