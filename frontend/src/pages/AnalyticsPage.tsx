import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import type { Transaction } from '../types'
import { formatMoney } from '../utils/format'

const MONTHS = Array.from({ length: 12 }, (_, index) => {
  const name = new Date(2020, index, 1).toLocaleDateString('ru-RU', { month: 'long' })
  return name[0].toUpperCase() + name.slice(1)
})

function calculateTotals(transactions: Transaction[]) {
  let income = 0
  let expense = 0
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount
    if (tx.type === 'expanse') expense += tx.amount
  }
  return { income, expense }
}

function SummaryCards({
  income,
  expense,
  count,
}: {
  income: number
  expense: number
  count: number
}) {
  const netFlow = income - expense

  return (
    <div className="stat-grid">
      <div className="stat-tile">
        <p className="label">Доходы</p>
        <p className="value green">{income > 0 ? '+' : ''}{formatMoney(income)}</p>
      </div>
      <div className="stat-tile">
        <p className="label">Расходы</p>
        <p className="value red">{expense > 0 ? '-' : ''}{formatMoney(expense)}</p>
      </div>
      <div className="stat-tile">
        <p className="label">Чистый поток</p>
        <p className={`value ${netFlow >= 0 ? 'green' : 'red'}`}>
          {netFlow > 0 ? '+' : netFlow < 0 ? '-' : ''}{formatMoney(netFlow)}
        </p>
      </div>
      <div className="stat-tile">
        <p className="label">Операций</p>
        <p className="value">{count}</p>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const { categories, transactions, loading, error } = useFinance()
  const [period, setPeriod] = useState<'month' | 'all'>('month')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const currentYear = new Date().getFullYear()

  const firstYear = transactions.reduce(
    (year, tx) => Math.min(year, new Date(tx.created_at).getFullYear()),
    Math.min(currentYear, selectedYear),
  )
  const years = Array.from({ length: currentYear - firstYear + 1 }, (_, index) => currentYear - index)

  const monthTransactions = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1)
    const end = new Date(selectedYear, selectedMonth + 1, 1)
    return transactions.filter((tx) => {
      const date = new Date(tx.created_at)
      return date >= start && date < end
    })
  }, [transactions, selectedYear, selectedMonth])

  const periodTransactions = period === 'month' ? monthTransactions : transactions
  const totals = useMemo(() => calculateTotals(periodTransactions), [periodTransactions])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of periodTransactions) {
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
  }, [categories, periodTransactions])

  return (
    <>
      <h1 className="page-title">Аналитика</h1>
      <p className="page-subtitle">Доходы, расходы и категории</p>
      {loading ? <p className="page-subtitle">Загрузка…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <section className="section">
        <div className="analytics-period-tabs" aria-label="Период аналитики">
          <button
            type="button"
            className={`type-tab${period === 'month' ? ' active' : ''}`}
            aria-pressed={period === 'month'}
            onClick={() => setPeriod('month')}
          >
            За месяц
          </button>
          <button
            type="button"
            className={`type-tab${period === 'all' ? ' active' : ''}`}
            aria-pressed={period === 'all'}
            onClick={() => setPeriod('all')}
          >
            За всё время
          </button>
        </div>
        <div className={`analytics-selectors${period === 'all' ? ' is-disabled' : ''}`}>
          <div className="analytics-select-field">
            <label htmlFor="analytics-month">Месяц</label>
            <select
              id="analytics-month"
              value={selectedMonth}
              disabled={period === 'all'}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index}>{name}</option>
              ))}
            </select>
          </div>
          <div className="analytics-select-field">
            <label htmlFor="analytics-year">Год</label>
            <select
              id="analytics-year"
              value={selectedYear}
              disabled={period === 'all'}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <SummaryCards
          income={totals.income}
          expense={totals.expense}
          count={periodTransactions.length}
        />
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title plain">Расходы по категориям</h2>
          <Link className="link-btn" to="/categories">Категории</Link>
        </div>
        <div className="panel">
          {byCategory.rows.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              {period === 'month' ? 'В этом месяце расходов нет' : 'Расходов пока нет'}
            </p>
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
