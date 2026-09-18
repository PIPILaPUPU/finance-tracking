package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/PIPILaPUPU/finance-tracking/account-app/config"
	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/auth"
	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/handler"
	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/repository"
	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/service"
	"github.com/PIPILaPUPU/finance-tracking/database"
	"github.com/PIPILaPUPU/finance-tracking/logger"
	"github.com/go-chi/chi/v5"
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

	logger.Debug("account-app starting")
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
	db, err := database.Open(startUpCtx, cfg.Database.URL)
	if err != nil {
		logger.Error("open database", "error", err)
	}
	defer db.Close()

	logger.Info("account-app started", "port", cfg.Server.Port)

	//==============================HANDLERS==================================
	r := chi.NewRouter()

	repo := repository.NewPostgresAccountRepository(db, logger)
	authService := service.NewTransactionService(repo)
	authHandler := handler.NewTransactionHandler(authService, *logger)

	authMiddleware := auth.NewMiddleware(cfg.JWT.Secret, cfg.JWT.Issuer)

	r.Use(authMiddleware.Authenticate)

	r.Post("/accounts", authHandler.Create)
	r.Get("/accounts", authHandler.GetAll)
	r.Get("/accounts/{id}", authHandler.GetByID)
	r.Delete("/accounts/{id}", authHandler.Delete)

	//==============================SERVER==================================
	r.Get("/health_status", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := db.Ping(ctx); err != nil {
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status": "ok", "service": "account"}`))
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
