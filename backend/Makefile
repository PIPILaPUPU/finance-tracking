DATABASE_URL ?= postgres://postgres://postgres:postgres@localhost:5432/finance_tracker?sslmode=disable
GOOSE := go run github.com/pressly/goose/v3/cmd/goose@latest

migrate-up:
	$(GOOSE) -dir auth-app/migrations postgres "$(DATABASE_URL)" up
	$(GOOSE) -dir buySell-app/migrations postgres "$(DATABASE_URL)" up

migrate-down:
	$(GOOSE) -dir buySell-app/migrations postgres "$(DATABASE_URL)" down
	$(GOOSE) -dir auth-app/migrations postgres "$(DATABASE_URL)" down