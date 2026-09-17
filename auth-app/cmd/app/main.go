package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/config"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/handler"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/logger"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/repository"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/service"
	"github.com/PIPILaPUPU/finance-tracking/database"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	if err := run(); err != nil {
		slog.Error("auth service stoped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	//==============================LOGGER==================================
	logger := logger.NewLogger(logger.Config{
		Level:     slog.LevelDebug,
		AddSource: false,
	})

	logger.Debug("auth-app starting")
	logger.Info("check stats")

	//==============================CONFIG==================================
	configPath := flag.String("config", "config/config.yaml", "path to config file")
	flag.Parse()

	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		logger.Error("load config", "error", err)
		return err
	}

	//==============================DATABASE==================================
	startUpCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	db, err := database.Open(startUpCtx, cfg.Database.Url)
	if err != nil {
		logger.Error("open database", "error", err)
	}
	defer db.Close()

	logger.Info("auth-app started", "port", cfg.Server.Port)

	//==============================HANDLERS==================================

	//TODO
	repo := repository.NewPostgresUserRepository(db, logger)
	authService := service.NewAuthService(repo, service.Config{
		JWTSecret:  cfg.JWT.Secret,
		JWTIssuer:  cfg.JWT.Issuer,
		AccessTTL:  cfg.JWT.AccessTTL,
		RefreshTTL: cfg.JWT.RefreshTTL,
	})
	authHandler := handler.NewAuthHandler(authService, handler.CookieConfig{
		Secure:   cfg.Cookie.Secure,
		SameSite: parseSameSite(cfg.Cookie.SameSite),
		TTL:      cfg.JWT.RefreshTTL,
	}, *logger)

	//==============================SERVER==================================
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/refresh", authHandler.Refresh)
		r.Post("/logout", authHandler.Logout)
		r.With(authHandler.Authenticate).Get("/me", authHandler.Me)
	})

	r.Get("/health_status", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := db.Ping(ctx); err != nil {
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status": "ok"}`))
	})

	server := &http.Server{
		Addr:              ":" + cfg.Server.Port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverError := make(chan error, 1)
	go func() {
		slog.Info("Starting service ", "address", cfg.Server.Port)
		serverError <- server.ListenAndServe()
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	select {
	case err := <-serverError:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-stop:
	}

	shutDownCtx, shutDownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutDownCancel()
	return server.Shutdown(shutDownCtx)
}

func parseSameSite(value string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	case "lax":
		return http.SameSiteLaxMode
	default:
		return http.SameSiteLaxMode
	}
}
