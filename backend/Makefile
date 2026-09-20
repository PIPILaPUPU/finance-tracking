DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/finance_tracker?sslmode=disable
GOOSE := go run github.com/pressly/goose/v3/cmd/goose@latest
MIGRATIONS_DIR := ../migtarions

.PHONY: migrate-up migrate-down

migrate-up:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" up

migrate-down:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" down
