package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/auth"
	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/model"
	accountservice "github.com/PIPILaPUPU/finance-tracking/account-app/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type accountService interface {
	Create(context.Context, uuid.UUID, model.CreateAccountRequest) (model.Account, error)
	GetAll(context.Context, uuid.UUID) ([]model.Account, error)
	GetByID(context.Context, uuid.UUID, uuid.UUID) (model.Account, error)
	GetSubAccounts(context.Context, uuid.UUID, uuid.UUID) ([]model.Account, error)
	Update(context.Context, uuid.UUID, uuid.UUID, model.UpdateAccountRequest) (model.Account, error)
	Delete(context.Context, uuid.UUID, uuid.UUID) error
}

type AccountHandler struct {
	service accountService
	Logger  *slog.Logger
}

func NewTransactionHandler(tranService accountService, log slog.Logger) *AccountHandler {
	return &AccountHandler{service: tranService, Logger: &log}
}

// =================================HANDLER FUNCTION=======================================
func (h *AccountHandler) Create(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	var request model.CreateAccountRequest

	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	account, err := h.service.Create(r.Context(), Claims.UserID, request)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, account)
}

func (h *AccountHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	var accountList []model.Account

	accountList, err := h.service.GetAll(r.Context(), Claims.UserID)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, accountList)
}

func (h *AccountHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	account, err := h.service.GetByID(r.Context(), Claims.UserID, id)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, account)
}

func (h *AccountHandler) GetSubAccounts(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	subs, err := h.service.GetSubAccounts(r.Context(), Claims.UserID, id)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, subs)
}

func (h *AccountHandler) Update(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	var request model.UpdateAccountRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	account, err := h.service.Update(r.Context(), Claims.UserID, id, request)
	if err != nil {
		writeHTTPError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, account)
}

func (h *AccountHandler) Delete(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "invalid account id")
		return
	}

	err = h.service.Delete(r.Context(), Claims.UserID, id)
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
	case errors.Is(err, accountservice.ErrInvalidRequest):
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
	case errors.Is(err, accountservice.ErrAccountNotFound):
		writeError(w, http.StatusNotFound, "not_found", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal_server_error", "internal server error")
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"error": code, "message": message})
}
