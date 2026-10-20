-- +goose Up
WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.7',
        'Что нового в Finance Tracker',
        'Добавлена функция отмены операции!.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('Добавлена функция отмены операции!.', 1),
        ('Теперь можно отменять операции, что позволяет пользователям исправлять ошибки при вводе данных.', 2),
        ('Исправлена ошибка запуска приложения.', 3)
) AS item(text, sort_order);

-- +goose Down
DELETE FROM releases WHERE version = '1.0.7';
