-- +goose Up
ALTER TABLE transactions
    ADD COLUMN cancelled_at TIMESTAMPTZ;

CREATE INDEX idx_transactions_user_active_created
    ON transactions (user_id, created_at DESC)
    WHERE cancelled_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_transactions_user_active_created;

ALTER TABLE transactions
    DROP COLUMN cancelled_at;
