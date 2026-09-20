import { formatMoney } from '../utils/format'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface ExpenseChartProps {
  values: number[]
  periodLabel?: string
}

export function ExpenseChart({ values, periodLabel = 'Сентябрь' }: ExpenseChartProps) {
  const max = Math.max(...values, 1)

  return (
    <section className="chart-card">
      <div className="chart-header">
        <h3>Динамика расходов</h3>
        <span className="chart-period">{periodLabel}</span>
      </div>
      <div className="bar-chart" role="img" aria-label="График расходов по дням недели">
        {values.map((value, i) => (
          <div className="bar-col" key={DAYS[i]}>
            <div
              className="bar"
              style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
              title={`${DAYS[i]}: ${formatMoney(value)}`}
            />
            <span className="bar-label">{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
