-- +goose Up
WITH release AS (
    INSERT INTO releases (version, title, description)
    VALUES (
        '1.0.8',
        'Что нового в Finance Tracker',
        'Аналитика стала удобнее, а операции теперь можно фильтровать по счетам и субсчетам.'
    )
    RETURNING id
)
INSERT INTO release_items (release_id, text, sort_order)
SELECT release.id, item.text, item.sort_order
FROM release
CROSS JOIN (
    VALUES
        ('В аналитике можно переключаться между текущим месяцем и всем периодом: доходы, расходы, чистый поток и количество операций пересчитываются автоматически.', 1),
        ('Для анализа отдельного месяца добавлен выбор месяца и года; расходы по категориям показываются за выбранный период.', 2),
        ('Операции можно фильтровать по основному счёту и субсчёту вместе с типом операции.', 3),
        ('Подпись месяца на графике расходов теперь обновляется автоматически.', 4)
) AS item(text, sort_order);

-- +goose Down
DELETE FROM releases WHERE version = '1.0.8';
