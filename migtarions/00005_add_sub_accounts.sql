-- +goose Up
ALTER TABLE Accounts
    ADD COLUMN IF NOT EXISTS Parent_id UUID REFERENCES Accounts(ID) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS Allocation_rule VARCHAR(16) NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS Percent INT;

ALTER TABLE Accounts
    ADD CONSTRAINT chk_accounts_allocation_rule
        CHECK (Allocation_rule IN ('manual', 'percent'));

ALTER TABLE Accounts
    ADD CONSTRAINT chk_accounts_percent
        CHECK (
            (Allocation_rule = 'manual' AND Percent IS NULL)
            OR (Allocation_rule = 'percent' AND Percent IS NOT NULL AND Percent BETWEEN 1 AND 100)
        );

ALTER TABLE Accounts
    ADD CONSTRAINT chk_accounts_parent_self
        CHECK (Parent_id IS NULL OR Parent_id <> ID);

CREATE INDEX IF NOT EXISTS idx_accounts_parent_id ON Accounts(Parent_id);

-- +goose Down
DROP INDEX IF EXISTS idx_accounts_parent_id;

ALTER TABLE Accounts DROP CONSTRAINT IF EXISTS chk_accounts_parent_self;
ALTER TABLE Accounts DROP CONSTRAINT IF EXISTS chk_accounts_percent;
ALTER TABLE Accounts DROP CONSTRAINT IF EXISTS chk_accounts_allocation_rule;

ALTER TABLE Accounts
    DROP COLUMN IF EXISTS Percent,
    DROP COLUMN IF EXISTS Allocation_rule,
    DROP COLUMN IF EXISTS Parent_id;
