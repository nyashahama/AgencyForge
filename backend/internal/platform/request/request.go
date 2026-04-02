package request

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

const (
	DefaultPage    = 1
	DefaultPerPage = 20
	MaxPerPage     = 100
)

var ErrInvalidUUIDParam = errors.New("invalid uuid route parameter")

type Pagination struct {
	Page    int
	PerPage int
}

func DecodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func UUIDPathParam(r *http.Request, key string) (uuid.UUID, error) {
	value := chi.URLParam(r, key)
	if value == "" {
		return uuid.Nil, fmt.Errorf("%w: %s", ErrInvalidUUIDParam, key)
	}

	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%w: %s", ErrInvalidUUIDParam, key)
	}

	return id, nil
}

func ParsePagination(r *http.Request) (Pagination, error) {
	page, err := parsePositiveInt(r.URL.Query().Get("page"), DefaultPage, "page")
	if err != nil {
		return Pagination{}, err
	}

	perPage, err := parsePositiveInt(r.URL.Query().Get("per_page"), DefaultPerPage, "per_page")
	if err != nil {
		return Pagination{}, err
	}

	if perPage > MaxPerPage {
		perPage = MaxPerPage
	}

	return Pagination{
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (p Pagination) Offset() int {
	return (p.Page - 1) * p.PerPage
}

func (p Pagination) Meta(total int) response.Meta {
	return response.Meta{
		Page:    p.Page,
		PerPage: p.PerPage,
		Total:   total,
	}
}

func parsePositiveInt(raw string, fallback int, field string) (int, error) {
	if raw == "" {
		return fallback, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value < 1 {
		return 0, fmt.Errorf("%s must be a positive integer", field)
	}

	return value, nil
}
