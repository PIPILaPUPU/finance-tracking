import type { Account } from '../types'
import { formatMoney } from '../utils/format'
import { IconCard, IconCash, IconPiggy } from './Icons'

function AccountGlyph({ account }: { account: Account }) {
  const icon = account.icon ?? 'card'
  if (icon === 'piggy') return <IconPiggy width={20} height={20} />
  if (icon === 'cash') return <IconCash width={20} height={20} />
  return <IconCard width={20} height={20} />
}

export function AccountCard({
  account,
  subCount = 0,
}: {
  account: Account
  subCount?: number
}) {
  return (
    <article className="account-card">
      <div className="account-card-top">
        <div className="account-icon" style={{ background: account.color ?? '#5B4BFF' }}>
          <AccountGlyph account={account} />
        </div>
        {account.mask ? <span className="account-mask">•••• {account.mask}</span> : null}
      </div>
      <h3 className="account-name">{account.name}</h3>
      {subCount > 0 ? (
        <p className="account-subs">
          {subCount} субсчёт{subCount === 1 ? '' : subCount < 5 ? 'а' : 'ов'}
        </p>
      ) : null}
      <p className="account-balance">{formatMoney(account.balance, account.currency)}</p>
    </article>
  )
}

export function AccountRow({
  account,
  onDelete,
  onAddSub,
  onEdit,
  nested = false,
}: {
  account: Account
  onDelete?: () => void
  onAddSub?: () => void
  onEdit?: () => void
  nested?: boolean
}) {
  return (
    <article className={`account-row${nested ? ' nested' : ''}`}>
      <div className="account-icon" style={{ background: account.color ?? '#5B4BFF' }}>
        <AccountGlyph account={account} />
      </div>
      <div className="meta">
        <h3>{account.name}</h3>
        <p>
          {nested
            ? account.allocation_rule === 'percent' && account.percent != null
              ? `Субсчёт · ${account.percent}%`
              : 'Субсчёт'
            : account.type}
          {account.mask ? ` · •••• ${account.mask}` : ''}
        </p>
      </div>
      <div className="amount">{formatMoney(account.balance, account.currency)}</div>
      {onEdit ? (
        <button type="button" className="icon-action" onClick={onEdit} aria-label="Редактировать">
          ✎
        </button>
      ) : null}
      {onAddSub ? (
        <button type="button" className="icon-action" onClick={onAddSub} aria-label="Добавить субсчёт">
          +
        </button>
      ) : null}
      {onDelete ? (
        <button type="button" className="icon-action danger" onClick={onDelete} aria-label="Удалить">
          ×
        </button>
      ) : null}
    </article>
  )
}
