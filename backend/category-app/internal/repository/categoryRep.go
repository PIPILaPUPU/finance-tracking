package repository

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/PIPILaPUPU/finance-tracking/category-app/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound     = errors.New("category not found")
	categoryColumns = `id, userid, categoryname, is_expense, is_income, color, icon, created_at, updated_at`
)

type CategoryRepository interface {
	Create(context.Context, uuid.UUID, model.Category) (model.Category, error)
	GetAll(context.Context, uuid.UUID) ([]model.Category, error)
	GetById(context.Context, uuid.UUID, uuid.UUID) (model.Category, error)
	Update(context.Context, uuid.UUID, uuid.UUID, model.Category) (model.Category, error)
	Delete(context.Context, uuid.UUID, uuid.UUID) error
}

type PostgreCategoryRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewPostgresCategoryRepository(pool *pgxpool.Pool, log *slog.Logger) *PostgreCategoryRepository {
	return &PostgreCategoryRepository{pool: pool, logger: log}
}

func scanCategory(row pgx.Row) (model.Category, error) {
	var c model.Category
	err := row.Scan(&c.ID, &c.User, &c.Name, &c.IsExpense, &c.IsIncome,
		&c.Color, &c.Icon, &c.Created_at, &c.Updated_at)
	return c, err
}

// Create inserts new category
func (r *PostgreCategoryRepository) Create(ctx context.Context, userID uuid.UUID, request model.Category) (model.Category, error) {
	row := r.pool.QueryRow(ctx, `
        INSERT INTO Category (id, userid, categoryname, is_expense, is_income, color, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING `+categoryColumns,
		request.ID, request.User, request.Name,
		request.IsExpense, request.IsIncome, request.Color, request.Icon)

	c, err := scanCategory(row)
	if err != nil {
		return model.Category{}, fmt.Errorf("create category: %w", err)
	}

	return c, nil
}

func (r *PostgreCategoryRepository) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Category, error) {
	rows, err := r.pool.Query(ctx, `
        SELECT `+categoryColumns+`
        FROM Category
        WHERE userid = $1
        ORDER BY created_at DESC, LOWER(categoryname) ASC
    `, userID)
	if err != nil {
		return nil, fmt.Errorf("get categories list: %w", err)
	}
	defer rows.Close()

	categories := make([]model.Category, 0)
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		categories = append(categories, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get categories list: %w", err)
	}

	return categories, nil
}

func (r *PostgreCategoryRepository) GetById(ctx context.Context, userID uuid.UUID, categoryId uuid.UUID) (model.Category, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+categoryColumns+` FROM Category WHERE id = $1 and userid = $2`, categoryId, userID)
	c, err := scanCategory(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Category{}, ErrNotFound
	}
	if err != nil {
		return model.Category{}, err
	}
	return c, nil
}

func (r *PostgreCategoryRepository) Update(ctx context.Context, userID uuid.UUID, categoryId uuid.UUID, request model.Category) (model.Category, error) {
	row := r.pool.QueryRow(ctx, `
        UPDATE Category
        SET categoryname = $1, is_expense = $2, is_income = $3, color = $4, icon = $5, updated_at = NOW()
        WHERE id = $6 AND userid = $7
        RETURNING `+categoryColumns+`
    `, request.Name, request.IsExpense, request.IsIncome, request.Color, request.Icon, categoryId, userID)

	c, err := scanCategory(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Category{}, ErrNotFound
		}
		return model.Category{}, fmt.Errorf("update category: %w", err)
	}

	return c, nil
}

func (r *PostgreCategoryRepository) Delete(ctx context.Context, userId uuid.UUID, categoryId uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM Category WHERE id = $1 AND userid = $2`, categoryId, userId)
	if err != nil {
		return fmt.Errorf("category remove: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
