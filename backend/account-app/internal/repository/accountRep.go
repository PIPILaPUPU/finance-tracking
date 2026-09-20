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
	ErrNotFound       = errors.New("Account not found")
	accountColumns    = `id, userid, name, type, currency, balance, parent_id, allocation_rule, percent, created_at, updated_at`
)

type AccountRepository interface {
	Create(context.Context, uuid.UUID, model.Account) (model.Account, error)
	GetAll(context.Context, uuid.UUID) ([]model.Account, error)
	GetById(context.Context, uuid.UUID, uuid.UUID) (model.Account, error)
	GetByParentID(context.Context, uuid.UUID, uuid.UUID) ([]model.Account, error)
	Delete(context.Context, uuid.UUID, uuid.UUID) error
}

type PostgreAccountRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewPostgresAccountRepository(pool *pgxpool.Pool, log *slog.Logger) *PostgreAccountRepository {
	return &PostgreAccountRepository{pool: pool, logger: log}
}

func scanAccount(row pgx.Row) (model.Account, error) {
	var account model.Account
	err := row.Scan(
		&account.ID,
		&account.UserId,
		&account.Name,
		&account.Type,
		&account.Currency,
		&account.Balance,
		&account.ParentID,
		&account.AllocationRule,
		&account.Percent,
		&account.Created_at,
		&account.Updated_at,
	)
	return account, err
}

func scanAccountFromRows(rows pgx.Rows) (model.Account, error) {
	var account model.Account
	err := rows.Scan(
		&account.ID,
		&account.UserId,
		&account.Name,
		&account.Type,
		&account.Currency,
		&account.Balance,
		&account.ParentID,
		&account.AllocationRule,
		&account.Percent,
		&account.Created_at,
		&account.Updated_at,
	)
	return account, err
}

// =================================INTERFACE FUNCTION=======================================
func (r *PostgreAccountRepository) Create(ctx context.Context,
	userID uuid.UUID,
	request model.Account) (model.Account, error) {
	query := `
		INSERT INTO Accounts (id, userid, name, type, currency, balance, parent_id, allocation_rule, percent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING ` + accountColumns

	row := r.pool.QueryRow(ctx, query,
		request.ID,
		request.UserId,
		request.Name,
		request.Type,
		request.Currency,
		request.Balance,
		request.ParentID,
		request.AllocationRule,
		request.Percent,
	)

	account, err := scanAccount(row)
	if err != nil {
		return model.Account{}, fmt.Errorf("create item: %w", err)
	}
	return account, nil
}

func (r *PostgreAccountRepository) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Account, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+accountColumns+`
		FROM Accounts
		WHERE userid = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get accounts list: %w", err)
	}
	defer rows.Close()

	accounts := make([]model.Account, 0)
	for rows.Next() {
		account, err := scanAccountFromRows(rows)
		if err != nil {
			return nil, fmt.Errorf("get items list: %w", err)
		}
		accounts = append(accounts, account)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get accounts list: %w", err)
	}

	return accounts, nil
}

func (r *PostgreAccountRepository) GetById(ctx context.Context, userID uuid.UUID, accountId uuid.UUID) (model.Account, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+accountColumns+` FROM Accounts WHERE id = $1 AND userid = $2`, accountId, userID)

	account, err := scanAccount(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Account{}, ErrNotFound
	}
	if err != nil {
		return model.Account{}, err
	}

	return account, nil
}

func (r *PostgreAccountRepository) GetByParentID(ctx context.Context, userID uuid.UUID, parentID uuid.UUID) ([]model.Account, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+accountColumns+`
		FROM Accounts
		WHERE userid = $1 AND parent_id = $2
		ORDER BY created_at ASC
	`, userID, parentID)
	if err != nil {
		return nil, fmt.Errorf("get sub-accounts: %w", err)
	}
	defer rows.Close()

	accounts := make([]model.Account, 0)
	for rows.Next() {
		account, err := scanAccountFromRows(rows)
		if err != nil {
			return nil, fmt.Errorf("get sub-accounts: %w", err)
		}
		accounts = append(accounts, account)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get sub-accounts: %w", err)
	}

	return accounts, nil
}

func (r *PostgreAccountRepository) Delete(ctx context.Context, userId uuid.UUID, accountId uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM Accounts WHERE id = $1 AND userid = $2`,
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
