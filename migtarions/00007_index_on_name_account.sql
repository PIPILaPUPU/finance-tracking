-- +goose Up
CREATE UNIQUE INDEX idx_accounts_userid_name ON Accounts (UserId, LOWER(Name));

-- +goose Down
DROP INDEX IF EXISTS idx_accounts_userid_name;
DROP INDEX IF EXISTS idx_accounts_id_name;
