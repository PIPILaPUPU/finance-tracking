package repository

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/PIPILaPUPU/finance-tracking/transaction-app/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var transactionColumn = `id, user_id, type, from_account_id, to_account_id, category_id, amount, description`

type PostgreTransactionRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewPostgresCategoryRepository(pool *pgxpool.Pool, log *slog.Logger) *PostgreTransactionRepository {
	return &PostgreTransactionRepository{pool: pool, logger: log}
}

func (r *PostgreTransactionRepository) Create(ctx context.Context, req model.Transaction) (model.Transaction, error) {
	query := `
		INSERT INTO transactions (` + transactionColumn + `)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at
	`

	row := r.pool.QueryRow(ctx, query, req.Id, req.User_id, req.Type, req.From_account_id, req.To_account_id, req.Category_id, req.Amount, req.Description)

	var t model.Transaction
	err := row.Scan(&t.Id, &t.User_id, &t.Type, &t.From_account_id, &t.To_account_id, &t.Category_id, &t.Amount, &t.Description, &t.Created_at)
	if err != nil {
		return model.Transaction{}, err
	}

	return t, nil
}

func (r *PostgreTransactionRepository) GetAll(ctx context.Context, UserId uuid.UUID) ([]model.Transaction, error) {
	query := `SELECT ` + transactionColumn + ` FROM transactions WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, UserId)
	if err != nil {
		return nil, fmt.Errorf("get transactions list: %w", err)
	}
	defer rows.Close()

	var transactions []model.Transaction

	for rows.Next() {
		var t model.Transaction
		err = rows.Scan(&t.Id, &t.User_id, &t.Type, &t.From_account_id, &t.To_account_id, &t.Category_id, &t.Amount, &t.Description, &t.Created_at)
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

func (r *PostgreTransactionRepository) GetById(ctx context.Context, UserId uuid.UUID, transactionId uuid.UUID) (model.Transaction, error) {
	query := `SELECT ` + transactionColumn + ` FROM transactions WHERE id = $1 AND user_id = $2`

	var t model.Transaction

	row := r.pool.QueryRow(ctx, query, transactionId, UserId)
	err := row.Scan(&t.Id, &t.User_id, &t.Type, &t.From_account_id, &t.To_account_id, &t.Category_id, &t.Amount, &t.Description, &t.Created_at)
	if err != nil {
		return model.Transaction{}, err
	}

	return t, nil
}
