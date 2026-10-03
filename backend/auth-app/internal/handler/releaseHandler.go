package handler

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/service"
	"github.com/google/uuid"
)

type releaseService interface {
	Latest(context.Context) (model.Release, error)
	MarkSeen(context.Context, uuid.UUID) error
}

type ReleaseHandler struct {
	service releaseService
	logger  *slog.Logger
}

func NewReleaseHandler(releaseService releaseService, log slog.Logger) *ReleaseHandler {
	return &ReleaseHandler{service: releaseService, logger: &log}
}

func (h *ReleaseHandler) Latest(w http.ResponseWriter, r *http.Request) {
	release, err := h.service.Latest(r.Context())
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, release)
}

func (h *ReleaseHandler) MarkSeen(w http.ResponseWriter, r *http.Request) {
	claims, ok := ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "invalid_token", "access token is invalid")
		return
	}
	if err := h.service.MarkSeen(r.Context(), claims.UserID); err != nil {
		h.writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ReleaseHandler) writeServiceError(w http.ResponseWriter, err error) {
	if errors.Is(err, service.ErrReleaseNotFound) {
		writeError(w, http.StatusNotFound, "release_not_found", "release not found")
		return
	}
	h.logger.Error("release request failed", "error", err)
	writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
}
