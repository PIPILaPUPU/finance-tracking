package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/PIPILaPUPU/finance-tracking/transaction-app/internal/auth"
	"github.com/PIPILaPUPU/finance-tracking/transaction-app/internal/model"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type TransactionService interface {
	Create(context.Context, uuid.UUID, model.CreateTransactionRequest) (model.Transaction, error)
	GetAll(context.Context, uuid.UUID) ([]model.Transaction, error)
	GetById(context.Context, uuid.UUID, uuid.UUID) (model.Transaction, error)
}

type TransactionHandler struct {
	service TransactionService
	logger  *slog.Logger
}

func NewTransactionHandler(service TransactionService, log slog.Logger) *TransactionHandler {
	return &TransactionHandler{service: service, logger: &log}
}

// =================================HANDLER FUNCTION=======================================
func (h *TransactionHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	var req model.CreateTransactionRequest
	if err := decodeJSON(w, r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	transaction, err := h.service.Create(r.Context(), Claims.UserID, req)
	if err != nil {
		http.Error(w, "failed to create transaction", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, transaction)
}

func (h *TransactionHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	transactions, err := h.service.GetAll(r.Context(), Claims.UserID)
	if err != nil {
		http.Error(w, "failed to get transactions", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, transactions)
}

func (h *TransactionHandler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	Claims, ok := auth.ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "authentication is required")
		return
	}

	transactionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "failed to get transaction", http.StatusBadRequest)
		return
	}

	transaction, err := h.service.GetById(r.Context(), Claims.UserID, transactionID)
	if err != nil {
		http.Error(w, "failed to get transaction", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, transaction)
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

// func writeHTTPError(w http.ResponseWriter, err error) {
// 	switch {
// 	case err == nil:
// 		writeError(w, http.StatusInternalServerError, "internal_server_error", "internal server error")
// 	case errors.Is(err, service.ErrInvalidRequest):
// 		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
// 	case errors.Is(err, service.ErrCategoryNotFound):
// 		writeError(w, http.StatusNotFound, "not_found", err.Error())
// 	default:
// 		writeError(w, http.StatusInternalServerError, "internal_server_error", "internal server error")
// 	}
// }

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"error": code, "message": message})
}
