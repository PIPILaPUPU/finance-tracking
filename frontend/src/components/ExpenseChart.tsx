import { formatMoney } from '../utils/format'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface ExpenseChartProps {
  values: number[]
  periodLabel?: string
  labels?: string[]
}

export function ExpenseChart({ values, periodLabel, labels = DAYS }: ExpenseChartProps) {
  const max = Math.max(...values, 1)
  const month = new Date().toLocaleString('ru-RU', { month: 'long' })
  const label = periodLabel ?? (month[0].toUpperCase() + month.slice(1))

  return (
    <section className="chart-card">
      <div className="chart-header">
        <h3>Динамика расходов</h3>
        <span className="chart-period">{label}</span>
      </div>
      <div className="bar-chart-scroll">
        <div
          className="bar-chart"
          role="img"
          aria-label="График расходов за выбранный период"
          style={{
            gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
            minWidth: labels.length > 7 ? labels.length * 64 : undefined,
          }}
        >
          {values.map((value, i) => (
            <div className="bar-col" key={labels[i]}>
              <div
                className="bar"
                style={{
                  height: value > 0 ? `${Math.max(10, (value / max) * 100)}%` : 0,
                  minHeight: value > 0 ? undefined : 0,
                }}
                title={`${labels[i]}: ${formatMoney(value)}`}
              />
              <span className="bar-label">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
