-- +goose Up
-- Release backlog for deploy tag v1.0.4
--
-- Version in INSERT must match the git tag. Migrations run before app containers start.
WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.4',
        'Что нового в Finance Tracker',
        'Исправлена перезагрузка страниц «Счета» и «Категории», улучшено восстановление сессии.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('Исправлено: F5 на «Счета» и «Категории» больше не отдаёт ошибку авторизации.', 1),
        ('API перенесён под префикс /api — страницы приложения и запросы данных больше не конфликтуют.', 2),
        ('Улучшено восстановление сессии при перезагрузке вкладки.', 3)
) AS item(text, sort_order);

-- +goose Down
DELETE FROM releases WHERE version = '1.0.4';
