-- +goose Up
ALTER TABLE Category
    ADD COLUMN IF NOT EXISTS Is_expense BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS Is_income BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS Color VARCHAR(7) NOT NULL DEFAULT '#5B4BFF',
    ADD COLUMN IF NOT EXISTS Icon VARCHAR(32) NOT NULL DEFAULT 'tag';

ALTER TABLE Category
    ADD CONSTRAINT chk_category_kind CHECK (Is_expense OR Is_income);

-- Base category set every user gets. Names already taken by the user are left untouched,
-- so the statement is safe to re-run. New users are seeded on registration instead.
INSERT INTO Category (ID, UserId, CategoryName, Is_expense, Is_income, Color, Icon)
SELECT gen_random_uuid(), u.ID, base.name, TRUE, TRUE, base.color, base.icon
FROM Users u
CROSS JOIN (VALUES
    ('Питание',      '#FF8A3D', 'food'),
    ('Жилье',        '#EC4899', 'home'),
    ('Транспорт',    '#3B5BDB', 'transport'),
    ('Покупки',      '#F59E0B', 'cart'),
    ('Развлечения',  '#8B5CF6', 'entertainment'),
    ('Здоровье',     '#EF4444', 'health'),
    ('Образование',  '#0EA5E9', 'education'),
    ('Зарплата',     '#22C55E', 'salary'),
    ('Финансы',      '#14B8A6', 'finance'),
    ('Путешествия',  '#F97316', 'travel'),
    ('Связь',        '#6366F1', 'internet')
) AS base(name, color, icon)
WHERE NOT EXISTS (
    SELECT 1 FROM Category c
    WHERE c.UserId = u.ID AND LOWER(c.CategoryName) = LOWER(base.name)
);

-- +goose Down
-- Seeded rows are kept: transactions may already reference them.
ALTER TABLE Category DROP CONSTRAINT IF EXISTS chk_category_kind;

ALTER TABLE Category
    DROP COLUMN IF EXISTS Icon,
    DROP COLUMN IF EXISTS Color,
    DROP COLUMN IF EXISTS Is_income,
    DROP COLUMN IF EXISTS Is_expense;
