-- +goose Up
-- Store money in minor units (kopecks/cents). Existing whole-ruble values become * 100.
UPDATE Accounts SET Balance = Balance * 100;
UPDATE transactions SET Amount = Amount * 100;

-- +goose Down
UPDATE Accounts SET Balance = Balance / 100;
UPDATE transactions SET Amount = Amount / 100;
