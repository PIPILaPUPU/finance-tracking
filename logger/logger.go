package logger

import (
	"log/slog"
	"os"
)

type Config struct {
	Level     slog.Level
	AddSource bool
}

func NewLogger(cfg Config) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level:     cfg.Level,
		AddSource: cfg.AddSource,
	}

	handler := slog.NewTextHandler(os.Stdout, opts)

	return slog.New(handler)
}
