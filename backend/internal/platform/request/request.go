package request

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

const (
	DefaultPage      = 1
	DefaultPerPage   = 20
	MaxPerPage       = 100
	maxJSONBodyBytes = 1 << 20
)

var ErrInvalidUUIDParam = errors.New("invalid uuid route parameter")

type Pagination struct {
	Page    int
	PerPage int
}

func DecodeJSON(r *http.Request, target any) error {
	body, err := io.ReadAll(io.LimitReader(r.Body, maxJSONBodyBytes+1))
	if err != nil {
		return err
	}
	if len(body) > maxJSONBodyBytes {
		return fmt.Errorf("request body must not exceed %d bytes", maxJSONBodyBytes)
	}

	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return errors.New("request body must contain only a single JSON value")
	}

	return nil
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
