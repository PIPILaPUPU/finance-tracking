-- +goose Up
CREATE TABLE releases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version     VARCHAR(32) NOT NULL UNIQUE,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE release_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (release_id, sort_order)
);

CREATE INDEX release_items_release_id_idx ON release_items(release_id);

ALTER TABLE users
    ADD COLUMN last_seen_release VARCHAR(32);

WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.1',
        'Что нового в Finance Tracker',
        'Мы улучшили работу со счетами, субсчетами и категориями.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('Добавлены ручные и процентные субсчета со свободным остатком основного счёта.', 1),
        ('Исправлено списание с субсчетов: баланс основного счёта теперь обновляется корректно.', 2),
        ('Обновлён дизайн счетов и добавлен раскрывающийся список субсчетов.', 3),
        ('Добавлены подтверждение удаления и отдельные кнопки редактирования.', 4),
        ('Категории получили типы, цвета и новые иконки.', 5)
) AS item(text, sort_order);

-- +goose Down
ALTER TABLE users
    DROP COLUMN IF EXISTS last_seen_release;

DROP TABLE IF EXISTS release_items;
DROP TABLE IF EXISTS releases;
