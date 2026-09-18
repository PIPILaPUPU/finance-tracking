-- +goose Up
CREATE TABLE Users (
    ID            UUID PRIMARY KEY,
    Username      varchar(32) NOT NULL,
    Email         varchar(255) NOT NULL,
    Password_hash varchar(255) NOT NULL,
    Created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    Updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_username_unique_ci ON users (LOWER(username));
CREATE UNIQUE INDEX users_email_unique_ci ON users (LOWER(email));

CREATE TABLE Refresh_sessions (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX refresh_sessions_user_id_idx ON refresh_sessions(user_id);
CREATE INDEX refresh_sessions_expires_at_idx ON refresh_sessions(expires_at);

-- +goose Down
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Refresh_sessions;