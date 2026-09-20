package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/PIPILaPUPU/finance-tracking/category-app/internal/auth"
	"github.com/PIPILaPUPU/finance-tracking/category-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/category-app/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CategoryService interface {
	Create(context.Context, uuid.UUID, model.CreateUpdateCategoryRequst) (model.Category, error)
	GetAll(context.Context, uuid.UUID) ([]model.Category, error)
	GetById(context.Context, uuid.UUID, uuid.UUID) (model.Category, error)
	Update(context.Context, uuid.UUID, uuid.UUID, model.CreateUpdateCategoryRequst) (model.Category, error)
	Delete(context.Context, uuid.UUID, uuid.UUID) error
}

type CategoryHandler struct {
	service CategoryService
	logger  *slog.Logger
}

func NewCategoryHandler(service CategoryService, log slog.Logger) *CategoryHandler {
	return &CategoryHandler{service: service, logger: &log}
}

// =================================HANDLER FUNCTION=======================================
func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	var request model.CreateUpdateCategoryRequst

	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	category, err := h.service.Create(r.Context(), Claims.UserID, request)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, category)
}

func (h *CategoryHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	categories, err := h.service.GetAll(r.Context(), Claims.UserID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, categories)
}

func (h *CategoryHandler) GetById(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	Id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	category, err := h.service.GetById(r.Context(), Claims.UserID, Id)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, category)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	Id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	var request model.CreateUpdateCategoryRequst
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	category, err := h.service.Update(r.Context(), Claims.UserID, Id, request)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, category)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	Id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	err = h.service.Delete(r.Context(), Claims.UserID, Id)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, "Success")
}

// =======================================JSON=============================================
func decodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&target); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request body must contain one JSON object")
	}

	return nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		slog.Error("write JSON response", "error", err)
	}
}

func writeHTTPError(w http.ResponseWriter, err error) {
	switch {
	case err == nil:
		writeError(w, http.StatusInternalServerError, "internal_server_error", "internal server error")
	case errors.Is(err, service.ErrInvalidRequest):
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
	case errors.Is(err, service.ErrCategoryNotFound):
		writeError(w, http.StatusNotFound, "not_found", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal_server_error", "internal server error")
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"error": code, "message": message})
}
