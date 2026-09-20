-- +goose Up
CREATE TABLE IF NOT EXISTS Category (
    ID UUID PRIMARY KEY,
    UserId UUID NOT NULL,
    CategoryName varchar(255),
    Created_at TIMESTAMPTZ DEFAULT NOW(),
    Updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_category_user_id ON Category(UserId);

-- +goose Down
DROP TABLE IF EXISTS Category;