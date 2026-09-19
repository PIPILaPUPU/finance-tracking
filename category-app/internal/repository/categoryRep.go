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
	categoryColumns = `id, userid, categoryname, created_at, updated_at`
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

// Create inserts new category
func (r *PostgreCategoryRepository) Create(ctx context.Context, userID uuid.UUID, request model.Category) (model.Category, error) {
	query := `
        INSERT INTO Category (id, userid, categoryname)
        VALUES ($1, $2, $3)
        RETURNING id, userid, categoryname, created_at, updated_at
    `

	row := r.pool.QueryRow(ctx, query, request.ID, request.User, request.Name)

	var c model.Category
	if err := row.Scan(&c.ID, &c.User, &c.Name, &c.Created_at, &c.Updated_at); err != nil {
		return model.Category{}, fmt.Errorf("create category: %w", err)
	}

	return c, nil
}

func (r *PostgreCategoryRepository) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Category, error) {
	rows, err := r.pool.Query(ctx, `
        SELECT id, userid, categoryname, created_at, updated_at
        FROM Category
        WHERE userid = $1
        ORDER BY created_at DESC
    `, userID)
	if err != nil {
		return nil, fmt.Errorf("get categories list: %w", err)
	}
	defer rows.Close()

	categories := make([]model.Category, 0)
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.ID, &c.User, &c.Name, &c.Created_at, &c.Updated_at); err != nil {
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
	var c model.Category
	err := row.Scan(&c.ID, &c.User, &c.Name, &c.Created_at, &c.Updated_at)
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
        SET categoryname = $1, updated_at = NOW()
        WHERE id = $2 AND userid = $3
        RETURNING `+categoryColumns+`
    `, request.Name, categoryId, userID)

	var c model.Category
	if err := row.Scan(&c.ID, &c.User, &c.Name, &c.Created_at, &c.Updated_at); err != nil {
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
