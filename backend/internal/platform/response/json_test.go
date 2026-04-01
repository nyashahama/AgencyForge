package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJSON(t *testing.T) {
	rec := httptest.NewRecorder()

	JSON(rec, http.StatusCreated, map[string]string{"status": "ok"})

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusCreated)
	}

	var payload SuccessResponse
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	data, ok := payload.Data.(map[string]any)
	if !ok {
		t.Fatalf("Data type = %T, want map[string]any", payload.Data)
	}

	if data["status"] != "ok" {
		t.Fatalf("status = %v, want ok", data["status"])
	}
}

func TestError(t *testing.T) {
	rec := httptest.NewRecorder()

	Error(rec, http.StatusBadRequest, "BAD_INPUT", "missing email")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var payload ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}

	if payload.Err.Code != "BAD_INPUT" {
		t.Fatalf("code = %q, want BAD_INPUT", payload.Err.Code)
	}
}
