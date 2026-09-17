package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/PIPILaPUPU/finance-tracking/database"
	"github.com/PIPILaPUPU/finance-tracking/spend-app/config"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("run: %v", err)
		os.Exit(1)
	}
}

func run() error {
	//TODO: add logger

	cfg, err := config.LoadConfig("spend-app/config/config.yaml")
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	db, err := database.Open(context.Background(), cfg.Database.URL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	r := chi.NewRouter()

	r.Get("/items_health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := db.Ping(ctx); err != nil {
			http.Error(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	log.Printf("spend-app starting on :%s", cfg.Server.Port)

	return nil
}
