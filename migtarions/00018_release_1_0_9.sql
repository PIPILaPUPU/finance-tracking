-- +goose Up
WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.9',
        'Что нового в Finance Tracker',
        'Finance Tracker теперь удобнее запускать с экрана телефона.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('Теперь трекер можно добавить на экран «Домой» как отдельное приложение без панели браузера.', 1),
        ('Добавлены иконки для домашнего экрана телефона.', 2),
        ('Если ярлык уже был создан, удалите его и добавьте сайт на экран «Домой» заново.', 3)
) AS item(text, sort_order);

-- +goose Down
DELETE FROM releases WHERE version = '1.0.9';
