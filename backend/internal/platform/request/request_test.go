package request

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func TestDecodeJSON(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{"name":"Meridian"}`))

	var payload struct {
		Name string `json:"name"`
	}
	if err := DecodeJSON(req, &payload); err != nil {
		t.Fatalf("DecodeJSON() error = %v", err)
	}

	if payload.Name != "Meridian" {
		t.Fatalf("Name = %q, want Meridian", payload.Name)
	}
}

func TestDecodeJSON_RejectsTrailingJSON(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{"name":"Meridian"}{"name":"Extra"}`))

	var payload struct {
		Name string `json:"name"`
	}
	if err := DecodeJSON(req, &payload); err == nil {
		t.Fatal("DecodeJSON() error = nil, want trailing JSON error")
	}
}

func TestDecodeJSON_RejectsOversizedBody(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader(`{"name":"`+strings.Repeat("a", maxJSONBodyBytes)+`"}`))

	var payload struct {
		Name string `json:"name"`
	}
	if err := DecodeJSON(req, &payload); err == nil {
		t.Fatal("DecodeJSON() error = nil, want oversized body error")
	}
}

func TestUUIDPathParam(t *testing.T) {
	id := uuid.New()
	req := httptest.NewRequest("GET", "/", nil)

	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("clientID", id.String())
	ctx := context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx)
	req = req.WithContext(ctx)

	got, err := UUIDPathParam(req, "clientID")
	if err != nil {
		t.Fatalf("UUIDPathParam() error = %v", err)
	}

	if got != id {
		t.Fatalf("UUIDPathParam() = %s, want %s", got, id)
	}
}

func TestParsePagination(t *testing.T) {
	req := httptest.NewRequest("GET", "/?page=2&per_page=250", nil)

	pagination, err := ParsePagination(req)
	if err != nil {
		t.Fatalf("ParsePagination() error = %v", err)
	}

	if pagination.Page != 2 {
		t.Fatalf("Page = %d, want 2", pagination.Page)
	}

	if pagination.PerPage != MaxPerPage {
		t.Fatalf("PerPage = %d, want %d", pagination.PerPage, MaxPerPage)
	}

	if pagination.Offset() != MaxPerPage {
		t.Fatalf("Offset = %d, want %d", pagination.Offset(), MaxPerPage)
	}
}

func TestParsePaginationInvalid(t *testing.T) {
	req := httptest.NewRequest("GET", "/?page=0", nil)

	if _, err := ParsePagination(req); err == nil {
		t.Fatal("ParsePagination() error = nil, want error")
	}
}
