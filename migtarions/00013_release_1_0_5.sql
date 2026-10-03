-- +goose Up
-- Release backlog for deploy tag v1.0.3
--
-- Version in INSERT must match the git tag. Migrations run before app containers start.
WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.5',
        'Что нового в Finance Tracker',
        'Исправлен баг загрузки страницы при перезагрузке страницы.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('Исправлен баг загрузки страницы при перезагрузке страницы.', 1)
) AS item(text, sort_order);

-- +goose Down
DELETE FROM releases WHERE version = '1.0.5';
