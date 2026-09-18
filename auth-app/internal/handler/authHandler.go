package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/repository"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/service"
	"github.com/google/uuid"
)

const refreshCookieName = "refresh_token"

type authService interface {
	Register(context.Context, model.RegisterRequest) (model.RegisterResponse, error) //TODO check the comming parametrs
	Login(context.Context, model.LoginRequest) (model.LoginResponse, error)
	Refresh(context.Context, string) (model.TokenResponse, error)
	Logout(context.Context, string) error
	ParseAccessToken(string) (model.Claims, error)
	UserByID(context.Context, uuid.UUID) (model.User, error)
}

type CookieConfig struct {
	Secure   bool
	SameSite http.SameSite
	TTL      time.Duration
}

type AuthHandler struct {
	service authService
	Cookie  CookieConfig
	Logger  *slog.Logger
}

func NewAuthHandler(authService authService, cookie CookieConfig, log slog.Logger) *AuthHandler {
	return &AuthHandler{service: authService, Cookie: cookie, Logger: &log}
}

// =================================HANDLER FUNCTION=======================================
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var request model.RegisterRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	result, err := h.service.Register(r.Context(), request)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}

	h.setRefreshCookie(w, result.RefreshToken)
	writeJSON(w, http.StatusOK, result)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var request model.LoginRequest
	if err := decodeJSON(w, r, &request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	result, err := h.service.Login(r.Context(), request)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}

	h.setRefreshCookie(w, result.RefreshToken)
	writeJSON(w, http.StatusOK, result)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_token", "refresh token is missing")
		return
	}

	result, err := h.service.Refresh(r.Context(), cookie.Value)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}

	h.setRefreshCookie(w, result.RefreshToken)
	writeJSON(w, http.StatusOK, result)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid_token", "refresh token is missing")
		return
	}
	if err := h.service.Logout(r.Context(), cookie.Value); err != nil {
		h.writeServiceError(w, err)
		return
	}
	h.clearRefreshCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := ClaimsFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "invalid_token", "access token is invalid")
		return
	}
	user, err := h.service.UserByID(r.Context(), claims.UserID)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Fields(r.Header.Get("Authorization"))
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			writeError(w, http.StatusUnauthorized, "invalid_token", "Bearer token is required")
			return
		}
		claims, err := h.service.ParseAccessToken(parts[1])
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid_token", "access token is invalid or expired")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), claimsContextKey{}, claims)))
	})
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

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"error": code, "message": message})
}

// =======================================ERROR STATUS=============================================

func (h *AuthHandler) writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidInput):
		writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
	case errors.Is(err, service.ErrInvalidCredentials):
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "username or password is incorrect")
	case errors.Is(err, service.ErrInvalidToken):
		writeError(w, http.StatusUnauthorized, "invalid_token", "token is invalid or expired")
	case errors.Is(err, repository.ErrUsernameExists):
		writeError(w, http.StatusConflict, "username_exists", "username is already registered")
	case errors.Is(err, repository.ErrEmailExists):
		writeError(w, http.StatusConflict, "email_exists", "email is already registered")
	default:
		slog.Error("auth request failed", "error", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
	}
}

// =======================================TOKEN=============================================
func (h *AuthHandler) setRefreshCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/auth",
		HttpOnly: true,
		Secure:   h.Cookie.Secure,
		SameSite: h.Cookie.SameSite,
		MaxAge:   int(h.Cookie.TTL.Seconds()),
	})
}

func (h *AuthHandler) clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Path:     "/auth",
		HttpOnly: true,
		Secure:   h.Cookie.Secure,
		SameSite: h.Cookie.SameSite,
		MaxAge:   -1,
	})
}

type claimsContextKey struct{}

func ClaimsFromContext(ctx context.Context) (model.Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey{}).(model.Claims)
	return claims, ok
}
