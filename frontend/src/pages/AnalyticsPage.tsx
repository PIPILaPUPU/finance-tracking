import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ExpenseChart } from '../components/ExpenseChart'
import { useFinance } from '../context/FinanceContext'
import { formatMoney } from '../utils/format'

export function AnalyticsPage() {
  const { categories, transactions, weeklyExpenses, monthIncome, monthExpense, totalBalance } =
    useFinance()

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type !== 'expanse') continue
      map.set(tx.category_id, (map.get(tx.category_id) ?? 0) + tx.amount)
    }
    const rows = [...map.entries()]
      .map(([id, amount]) => ({
        id,
        amount,
        name: categories.find((c) => c.id === id)?.name ?? 'Без категории',
        color: categories.find((c) => c.id === id)?.color ?? '#5B4BFF',
      }))
      .sort((a, b) => b.amount - a.amount)
    const max = Math.max(...rows.map((r) => r.amount), 1)
    return { rows, max }
  }, [categories, transactions])

  return (
    <>
      <h1 className="page-title">Аналитика</h1>
      <p className="page-subtitle">Сводка за текущий период</p>

      <div className="stat-grid">
        <div className="stat-tile">
          <p className="label">Баланс</p>
          <p className="value">{formatMoney(totalBalance)}</p>
        </div>
        <div className="stat-tile">
          <p className="label">Чистый поток</p>
          <p className={`value ${monthIncome - monthExpense >= 0 ? 'green' : 'red'}`}>
            {formatMoney(monthIncome - monthExpense)}
          </p>
        </div>
        <div className="stat-tile">
          <p className="label">Доходы</p>
          <p className="value green">+{formatMoney(monthIncome)}</p>
        </div>
        <div className="stat-tile">
          <p className="label">Расходы</p>
          <p className="value red">-{formatMoney(monthExpense)}</p>
        </div>
      </div>

      <section className="section">
        <ExpenseChart values={weeklyExpenses} />
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title plain">По категориям</h2>
          <Link className="link-btn" to="/categories">
            Все
          </Link>
        </div>
        <div className="panel">
          {byCategory.rows.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Пока нет расходов</p>
          ) : (
            <div className="cat-bars">
              {byCategory.rows.map((row) => (
                <div className="cat-bar-row" key={row.id}>
                  <div className="top">
                    <span>{row.name}</span>
                    <span>{formatMoney(row.amount)}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: `${(row.amount / byCategory.max) * 100}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
