package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReleaseRepository interface {
	FindByVersion(context.Context, string) (model.Release, error)
	MarkSeen(context.Context, uuid.UUID, string) error
}

type PostgresReleaseRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresReleaseRepository(pool *pgxpool.Pool) *PostgresReleaseRepository {
	return &PostgresReleaseRepository{pool: pool}
}

func (r *PostgresReleaseRepository) FindByVersion(ctx context.Context, version string) (model.Release, error) {
	var release model.Release
	err := r.pool.QueryRow(ctx, `
		SELECT id, version, title, description, created_at
		FROM releases
		WHERE version = $1
	`, version).Scan(
		&release.ID,
		&release.Version,
		&release.Title,
		&release.Description,
		&release.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Release{}, ErrNotFound
	}
	if err != nil {
		return model.Release{}, fmt.Errorf("find release by version: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, text, sort_order
		FROM release_items
		WHERE release_id = $1
		ORDER BY sort_order, id
	`, release.ID)
	if err != nil {
		return model.Release{}, fmt.Errorf("get release items: %w", err)
	}
	defer rows.Close()

	release.Items = make([]model.ReleaseItem, 0)
	for rows.Next() {
		var item model.ReleaseItem
		if err := rows.Scan(&item.ID, &item.Text, &item.SortOrder); err != nil {
			return model.Release{}, fmt.Errorf("scan release item: %w", err)
		}
		release.Items = append(release.Items, item)
	}
	if err := rows.Err(); err != nil {
		return model.Release{}, fmt.Errorf("iterate release items: %w", err)
	}

	return release, nil
}

func (r *PostgresReleaseRepository) MarkSeen(ctx context.Context, userID uuid.UUID, version string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE users
		SET last_seen_release = $1, updated_at = NOW()
		WHERE id = $2
			AND EXISTS (SELECT 1 FROM releases WHERE version = $1)
	`, version, userID)
	if err != nil {
		return fmt.Errorf("mark release seen: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
