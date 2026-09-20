-- +goose Up
CREATE TABLE IF NOT EXISTS Accounts (
    ID         UUID PRIMARY KEY,
	UserId     UUID NOT NULL,
	Name       VARCHAR(255) NOT NULL,    
	Type       VARCHAR(255) NOT NULL,     
	Currency   VARCHAR(3) NOT NULL,     
	Balance    BIGINT NOT NULL DEFAULT 0,     
	Created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	Updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
);

CREATE INDEX idx_accounts_user_id ON Accounts(UserId);

-- +goose Down
DROP TABLE IF EXISTS Accounts