package repository

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound        = errors.New("Account not found")
	transactionColumns = `id, userid, name, type, currency, balance,created_at, updated_at`
)

type AccountRepository interface {
	Create(context.Context, uuid.UUID, model.Account) (model.Account, error)
	GetAll(context.Context, uuid.UUID) ([]model.Account, error)
	GetById(context.Context, uuid.UUID, uuid.UUID) (model.Account, error)
	Delete(context.Context, uuid.UUID, uuid.UUID) error
}

type PostgreAccountRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewPostgresAccountRepository(pool *pgxpool.Pool, log *slog.Logger) *PostgreAccountRepository {
	return &PostgreAccountRepository{pool: pool, logger: log}
}

// =================================INTERFACE FUNCTION=======================================
func (r *PostgreAccountRepository) Create(ctx context.Context,
	userID uuid.UUID,
	request model.Account) (model.Account, error) {
	query := `
		INSERT INTO Accounts (id, userid, name, type, currency, balance)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, userid, name, type, currency, balance, created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		request.ID,
		request.UserId,
		request.Name,
		request.Type,
		request.Currency,
		request.Balance,
	)

	var Account model.Account
	err := row.Scan(&Account.ID, &Account.UserId, &Account.Name, &Account.Type, &Account.Currency, &Account.Balance, &Account.Created_at, &Account.Updated_at)
	if err != nil {
		return model.Account{}, fmt.Errorf("create item: %w", err)
	}
	return Account, nil

}

func (r *PostgreAccountRepository) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Account, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
			id,
			userid,
			name,
			type,
			currency,
			balance,
			created_at,
			updated_at
		FROM Accounts
		WHERE userid = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get accounts list: %w", err)
	}
	defer rows.Close()

	Accounts := make([]model.Account, 0)
	for rows.Next() {
		var account model.Account
		if err := rows.Scan(&account.ID, &account.UserId,
			&account.Name, &account.Type,
			&account.Currency, &account.Balance,
			&account.Created_at, &account.Updated_at); err != nil {
			return nil, fmt.Errorf("get items list: %w", err)
		}

		Accounts = append(Accounts, account)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get accounts list: %w", err)
	}

	return Accounts, nil
}

func (r *PostgreAccountRepository) GetById(ctx context.Context, userID uuid.UUID, accountId uuid.UUID) (model.Account, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+transactionColumns+` FROM Accounts WHERE id = $1 and userid = $2`, accountId, userID)
	var account model.Account
	err := row.Scan(&account.ID, &account.UserId,
		&account.Name, &account.Type,
		&account.Currency, &account.Balance,
		&account.Created_at, &account.Updated_at)

	if errors.Is(err, pgx.ErrNoRows) {
		return model.Account{}, ErrNotFound
	}

	if err != nil {
		return model.Account{}, err
	}

	return account, nil
}

func (r *PostgreAccountRepository) Delete(ctx context.Context, userId uuid.UUID, accountId uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM accounts WHERE id = $1 AND userid = $2`,
		accountId,
		userId)
	if err != nil {
		return fmt.Errorf("account remove: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
