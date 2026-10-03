-- +goose Up
-- Release backlog for deploy tag v1.0.2
--
-- How release notes work on deploy:
--   1. Add a migration like this with version = git tag without "v" (1.0.2 for v1.0.2).
--   2. Commit, push, tag: git tag v1.0.2 && git push origin v1.0.2
--   3. CI sets APP_VERSION=1.0.2; auth returns this release; users with
--      last_seen_release <> 1.0.2 see the "Что нового" modal once.
--
-- Version in INSERT must match the git tag. Migrations run before app containers start.
WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.3',
        'Что нового в Finance Tracker',
        'Исправлен баг обновления вкладки счетов и категорий при перезагрузке страницы.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('Исправлен баг обновления вкладки счетов и категорий при перезагрузке страницы.', 1)
) AS item(text, sort_order);

-- +goose Down
DELETE FROM releases WHERE version = '1.0.2';
