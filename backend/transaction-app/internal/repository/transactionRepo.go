package repository

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/PIPILaPUPU/finance-tracking/transaction-app/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrAccountNotFound             = errors.New("account not found")
	ErrInsufficientFunds           = errors.New("insufficient funds")
	ErrFundsReservedBySubAccounts  = errors.New("funds reserved by manual sub-accounts")
	transactionColumns   = `id, user_id, type, from_account_id, to_account_id, category_id, amount, description, created_at`
)

type PostgreTransactionRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewPostgresCategoryRepository(pool *pgxpool.Pool, log *slog.Logger) *PostgreTransactionRepository {
	return &PostgreTransactionRepository{pool: pool, logger: log}
}

func (r *PostgreTransactionRepository) Create(ctx context.Context, req model.Transaction) (model.Transaction, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return model.Transaction{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := applyBalanceChanges(ctx, tx, req); err != nil {
		return model.Transaction{}, err
	}

	row := tx.QueryRow(ctx, `
		INSERT INTO transactions (id, user_id, type, from_account_id, to_account_id, category_id, amount, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+transactionColumns,
		req.Id, req.User_id, req.Type, nullIfNilUUID(req.From_account_id), nullIfNilUUID(req.To_account_id),
		nullIfNilUUID(req.Category_id), req.Amount, req.Description,
	)

	created, err := scanTransaction(row)
	if err != nil {
		return model.Transaction{}, fmt.Errorf("create transaction: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.Transaction{}, fmt.Errorf("commit tx: %w", err)
	}

	return created, nil
}

func (r *PostgreTransactionRepository) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Transaction, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+transactionColumns+`
		FROM transactions
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get transactions list: %w", err)
	}
	defer rows.Close()

	transactions := make([]model.Transaction, 0)
	for rows.Next() {
		t, err := scanTransaction(rows)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get transactions list: %w", err)
	}

	return transactions, nil
}

func (r *PostgreTransactionRepository) GetById(ctx context.Context, userID uuid.UUID, transactionID uuid.UUID) (model.Transaction, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+transactionColumns+`
		FROM transactions
		WHERE id = $1 AND user_id = $2
	`, transactionID, userID)

	t, err := scanTransaction(row)
	if err != nil {
		return model.Transaction{}, err
	}
	return t, nil
}

func applyBalanceChanges(ctx context.Context, tx pgx.Tx, req model.Transaction) error {
	switch req.Type {
	case "expanse":
		return debitBalance(ctx, tx, req.User_id, req.From_account_id, req.Amount)
	case "income":
		return creditBalance(ctx, tx, req.User_id, req.To_account_id, req.Amount)
	case "transfer":
		if err := debitBalance(ctx, tx, req.User_id, req.From_account_id, req.Amount); err != nil {
			return err
		}
		return creditBalance(ctx, tx, req.User_id, req.To_account_id, req.Amount)
	default:
		return fmt.Errorf("unsupported transaction type %q", req.Type)
	}
}

func creditBalance(ctx context.Context, tx pgx.Tx, userID, accountID uuid.UUID, amount int64) error {
	if accountID == uuid.Nil {
		return fmt.Errorf("account id is required")
	}

	tag, err := tx.Exec(ctx, `
		UPDATE Accounts
		SET balance = balance + $1, updated_at = NOW()
		WHERE id = $2 AND userid = $3
	`, amount, accountID, userID)
	if err != nil {
		return fmt.Errorf("credit account: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrAccountNotFound
	}
	return nil
}

func debitBalance(ctx context.Context, tx pgx.Tx, userID, accountID uuid.UUID, amount int64) error {
	if accountID == uuid.Nil {
		return fmt.Errorf("account id is required")
	}

	tag, err := tx.Exec(ctx, `
		UPDATE Accounts a
		SET balance = balance - $1, updated_at = NOW()
		WHERE a.id = $2 AND a.userid = $3
			AND a.balance >= $1
			AND (
				a.parent_id IS NOT NULL
				OR $1 <= a.balance - COALESCE((
					SELECT SUM(s.balance)
					FROM Accounts s
					WHERE s.parent_id = a.id
						AND s.userid = a.userid
						AND s.allocation_rule = 'manual'
				), 0)
			)
	`, amount, accountID, userID)
	if err != nil {
		return fmt.Errorf("debit account: %w", err)
	}
	if tag.RowsAffected() > 0 {
		return nil
	}

	var balance, manualReserved int64
	var parentID *uuid.UUID
	err = tx.QueryRow(ctx, `
		SELECT
			a.balance,
			a.parent_id,
			COALESCE((
				SELECT SUM(s.balance)
				FROM Accounts s
				WHERE s.parent_id = a.id
					AND s.userid = a.userid
					AND s.allocation_rule = 'manual'
			), 0)
		FROM Accounts a
		WHERE a.id = $1 AND a.userid = $2
	`, accountID, userID).Scan(&balance, &parentID, &manualReserved)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrAccountNotFound
		}
		return fmt.Errorf("check account: %w", err)
	}
	if balance < amount {
		return ErrInsufficientFunds
	}
	if parentID == nil && manualReserved > 0 && amount > balance-manualReserved {
		return ErrFundsReservedBySubAccounts
	}
	return ErrInsufficientFunds
}

func nullIfNilUUID(id uuid.UUID) any {
	if id == uuid.Nil {
		return nil
	}
	return id
}

type scannable interface {
	Scan(dest ...any) error
}

func scanTransaction(row scannable) (model.Transaction, error) {
	var (
		t             model.Transaction
		fromAccountID *uuid.UUID
		toAccountID   *uuid.UUID
		categoryID    *uuid.UUID
	)
	err := row.Scan(
		&t.Id,
		&t.User_id,
		&t.Type,
		&fromAccountID,
		&toAccountID,
		&categoryID,
		&t.Amount,
		&t.Description,
		&t.Created_at,
	)
	if err != nil {
		return model.Transaction{}, err
	}
	if fromAccountID != nil {
		t.From_account_id = *fromAccountID
	}
	if toAccountID != nil {
		t.To_account_id = *toAccountID
	}
	if categoryID != nil {
		t.Category_id = *categoryID
	}
	return t, nil
}
