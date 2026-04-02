package apierr

import (
	"errors"
	"net/http"

	"github.com/nyashahama/AgencyForge/backend/internal/platform/response"
)

type Error struct {
	Status  int
	Code    string
	Message string
	Cause   error
}

func (e *Error) Error() string {
	return e.Message
}

func (e *Error) Unwrap() error {
	return e.Cause
}

func New(status int, code string, message string) *Error {
	return &Error{
		Status:  status,
		Code:    code,
		Message: message,
	}
}

func Wrap(status int, code string, message string, cause error) *Error {
	return &Error{
		Status:  status,
		Code:    code,
		Message: message,
		Cause:   cause,
	}
}

func Invalid(code string, message string) *Error {
	return New(http.StatusBadRequest, code, message)
}

func Unauthorized(code string, message string) *Error {
	return New(http.StatusUnauthorized, code, message)
}

func Forbidden(code string, message string) *Error {
	return New(http.StatusForbidden, code, message)
}

func NotFound(code string, message string) *Error {
	return New(http.StatusNotFound, code, message)
}

func Conflict(code string, message string) *Error {
	return New(http.StatusConflict, code, message)
}

func Internal(code string, message string, cause error) *Error {
	return Wrap(http.StatusInternalServerError, code, message, cause)
}

func As(err error) (*Error, bool) {
	var apiErr *Error
	if errors.As(err, &apiErr) {
		return apiErr, true
	}
	return nil, false
}

func Write(w http.ResponseWriter, err error) {
	if apiErr, ok := As(err); ok {
		response.Error(w, apiErr.Status, apiErr.Code, apiErr.Message)
		return
	}

	response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
}
