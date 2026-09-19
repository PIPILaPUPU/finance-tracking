-- +goose Up
CREATE TABLE transactions (
    Id                UUID PRIMARY KEY,
    User_id           UUID NOT NULL,
    Type              VARCHAR(16) NOT NULL,
    From_account_id   UUID,
    To_account_id     UUID,
    Category_id       UUID,
    Amount            BIGINT NOT NULL,
    Description       VARCHAR(255),
    Created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id
    ON transactions(User_id);

CREATE INDEX idx_transactions_from_account_id
    ON transactions(From_account_id);

CREATE INDEX idx_transactions_to_account_id
    ON transactions(To_account_id);

CREATE INDEX idx_transactions_category_id
    ON transactions(Category_id);

-- +goose Down

DROP TABLE transactions;