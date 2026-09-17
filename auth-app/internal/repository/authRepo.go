package repository

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound       = errors.New("not found")
	ErrUsernameExists = errors.New("username already exists")
	ErrEmailExists    = errors.New("email already exists")
	ErrInvalidSession = errors.New("invalid refresh session")
)

type UserRepository interface {
	CreateRefreshSession(context.Context, model.RefreshSession) error
	CreateUserWithSession(context.Context, model.User, model.RefreshSession) (model.User, error)
	FindByMail(context.Context, string) (model.User, error)
	FindUserByID(context.Context, uuid.UUID) (model.User, error)
	RotateRefreshSession(context.Context, string, model.RefreshSession) (model.User, error)
	RevokeRefreshSession(context.Context, string) error
}

type PostgresUserRepository struct {
	pool   *pgxpool.Pool
	logger *slog.Logger
}

func NewPostgresUserRepository(pool *pgxpool.Pool, log *slog.Logger) *PostgresUserRepository {
	return &PostgresUserRepository{pool: pool, logger: log}
}

var userColumns = `id, username, email, password_hash, created_at, updated_at`

func scanUser(row pgx.Row) (model.User, error) {
	var user model.User
	err := row.Scan(
		&user.ID, &user.Username, &user.Email,
		&user.Password_hash, &user.Created_at, &user.Updated_at)
	return user, err
}

// =================================INTERFACE FUNCTION=======================================
func (r *PostgresUserRepository) CreateUserWithSession(ctx context.Context,
	user model.User,
	refresh model.RefreshSession) (model.User, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return model.User{}, fmt.Errorf("begin registration: %w", err)
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `
		INSERT INTO users (id, username, email, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING `+userColumns, user.ID, user.Username, user.Email, user.Password_hash,
	)

	created, err := scanUser(row)
	if err != nil {
		return model.User{}, mapCreateUserError(err)
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)`, refresh.ID, user.ID, refresh.TokenHash, refresh.ExpiresAt); err != nil {
		return model.User{}, fmt.Errorf("create registration session: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.User{}, fmt.Errorf("commit registration: %w", err)
	}

	return created, nil
}

func (r *PostgresUserRepository) CreateRefreshSession(ctx context.Context, refresh model.RefreshSession) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)`, refresh.ID, refresh.UserID, refresh.TokenHash, refresh.ExpiresAt)
	if err != nil {
		return fmt.Errorf("create refresh session: %w", err)
	}

	return nil
}

func (r *PostgresUserRepository) RotateRefreshSession(ctx context.Context,
	oldHash string,
	replacement model.RefreshSession) (model.User, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return model.User{}, fmt.Errorf("begin refresh rotation: %w", err)
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	var expiresAt time.Time
	var revokedAt *time.Time
	err = tx.QueryRow(ctx, `
		SELECT user_id, expires_at, revoked_at
		FROM refresh_sessions
		WHERE token_hash = $1
		FOR UPDATE`, oldHash,
	).Scan(&userID, &expiresAt, &revokedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrInvalidSession
	}
	if err != nil {
		return model.User{}, fmt.Errorf("lock refresh session: %w", err)
	}
	if revokedAt != nil || !expiresAt.After(time.Now()) {
		return model.User{}, ErrInvalidSession
	}

	if _, err := tx.Exec(ctx, `UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = $1`, oldHash); err != nil {
		return model.User{}, fmt.Errorf("revoke old refresh session: %w", err)
	}

	replacement.UserID = userID
	if _, err := tx.Exec(ctx, `
		INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)`, replacement.ID, replacement.UserID, replacement.TokenHash, replacement.ExpiresAt); err != nil {
		return model.User{}, fmt.Errorf("insert replacement refresh session: %w", err)
	}

	user, err := scanUser(tx.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE id = $1`, userID,
	))
	if err != nil {
		return model.User{}, fmt.Errorf("find session user: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return model.User{}, fmt.Errorf("commit refresh rotation: %w", err)
	}
	return user, nil
}

func (r *PostgresUserRepository) RevokeRefreshSession(ctx context.Context, tokenHash string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE refresh_sessions
		SET revoked_at = NOW()
		WHERE token_hash = $1 AND revoked_at IS NULL`, tokenHash,
	)
	if err != nil {
		return fmt.Errorf("revoke refresh session: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrInvalidSession
	}
	return nil
}

func (r *PostgresUserRepository) FindByMail(ctx context.Context, email string) (model.User, error) {
	user, err := scanUser(r.pool.QueryRow(ctx, `SELECT `+userColumns+` FROM users WHERE LOWER(email) = LOWER($1)`, email))
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrNotFound
	}
	if err != nil {
		return model.User{}, fmt.Errorf("find user by email: %w", err)
	}

	return user, nil
}

func (r *PostgresUserRepository) FindUserByID(ctx context.Context, id uuid.UUID) (model.User, error) {
	user, err := scanUser(r.pool.QueryRow(ctx, `SELECT `+userColumns+` FROM users WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrNotFound
	}
	if err != nil {
		return model.User{}, fmt.Errorf("find user by id: %w", err)
	}

	return user, nil
}

// ================================ERRORS====================================
func mapCreateUserError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != "23505" {
		return fmt.Errorf("create user: %w", err)
	}
	switch pgErr.ConstraintName {
	case "users_username_unique_ci":
		return ErrUsernameExists
	case "users_email_unique_ci":
		return ErrEmailExists
	default:
		return fmt.Errorf("create user: %w", err)
	}
}
