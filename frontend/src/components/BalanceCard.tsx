import { formatMoney } from '../utils/format'
import { IconArrowDownLeft, IconArrowUpRight } from './Icons'

interface BalanceCardProps {
  total: number
  income: number
  expense: number
  currency?: string
}

export function BalanceCard({ total, income, expense, currency = 'RUB' }: BalanceCardProps) {
  return (
    <section className="balance-card" aria-label="Всего средств">
      <div className="balance-top">
        <p className="balance-label">Всего средств</p>
        <span className="currency-pill">{currency}</span>
      </div>
      <p className="balance-amount">{formatMoney(total)}</p>
      <div className="balance-stats">
        <div className="balance-stat">
          <div className="stat-icon" style={{ color: '#86efac' }}>
            <IconArrowDownLeft width={16} height={16} />
          </div>
          <div className="stat-meta">
            <p className="label">Доход</p>
            <p className="value income">+{formatMoney(income)}</p>
          </div>
        </div>
        <div className="balance-stat">
          <div className="stat-icon" style={{ color: '#fda4af' }}>
            <IconArrowUpRight width={16} height={16} />
          </div>
          <div className="stat-meta">
            <p className="label">Расход</p>
            <p className="value expense">-{formatMoney(expense)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
