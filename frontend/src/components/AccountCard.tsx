import { useState } from 'react'
import type { Account } from '../types'
import { getAvailableBalance } from '../utils/accounts'
import { formatMoney } from '../utils/format'
import { IconCard, IconCash, IconPiggy } from './Icons'

function AccountGlyph({ account }: { account: Account }) {
  const icon = account.icon ?? 'card'
  if (icon === 'piggy') return <IconPiggy width={20} height={20} />
  if (icon === 'cash') return <IconCash width={20} height={20} />
  return <IconCard width={20} height={20} />
}

function accountTypeLabel(account: Account, nested: boolean): string {
  if (nested) {
    let label = 'Субсчёт'
    if (account.allocation_rule === 'percent' && account.percent != null) {
      label += ` · ${account.percent}%`
    }
    return label
  }

  let label = account.type
  if (account.mask) label += ` · •••• ${account.mask}`
  return label
}

function subCountLabel(count: number): string {
  const word = count === 1 ? 'субсчёт' : count < 5 ? 'субсчёта' : 'субсчетов'
  return `${count} ${word}`
}

export function AccountCard({
  account,
  subCount = 0,
  subAccounts = [],
}: {
  account: Account
  subCount?: number
  subAccounts?: Account[]
}) {
  const available = getAvailableBalance(account, subAccounts)

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
        <p className="account-subs">{subCountLabel(subCount)}</p>
      ) : null}
      <p className="account-balance">{formatMoney(account.balance, account.currency)}</p>
      {available != null ? (
        <p className="account-available">
          Доступно: {formatMoney(available, account.currency)}
        </p>
      ) : null}
    </article>
  )
}

export function AccountRow({
  account,
  onDelete,
  onEdit,
  onAddSub,
  nested = false,
  subAccounts = [],
}: {
  account: Account
  onDelete?: () => void
  onEdit?: () => void
  onAddSub?: () => void
  nested?: boolean
  subAccounts?: Account[]
}) {
  const available = nested ? null : getAvailableBalance(account, subAccounts)

  return (
    <article className={`account-row${nested ? ' nested' : ''}`}>
      <div className="account-icon" style={{ background: account.color ?? '#5B4BFF' }}>
        <AccountGlyph account={account} />
      </div>
      <div className="meta">
        <div className="meta-top">
          <h3 className="meta-name">{account.name}</h3>
          <span className="account-type">{accountTypeLabel(account, nested)}</span>
        </div>
        <p className="meta-balance">{formatMoney(account.balance, account.currency)}</p>
        {available != null ? (
          <p className="meta-available">
            Доступно: {formatMoney(available, account.currency)}
          </p>
        ) : null}
      </div>
      {onEdit || onAddSub || onDelete ? (
        <div className="account-row-actions">
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
        </div>
      ) : null}
    </article>
  )
}

export function AccountGroup({
  account,
  subAccounts,
  onEdit,
  onAddSub,
  onDelete,
  onEditSub,
  onDeleteSub,
}: {
  account: Account
  subAccounts: Account[]
  onEdit: () => void
  onAddSub: () => void
  onDelete: () => void | Promise<void>
  onEditSub: (subId: string) => void
  onDeleteSub: (subId: string) => void | Promise<void>
}) {
  const [subsOpen, setSubsOpen] = useState(false)
  const hasSubs = subAccounts.length > 0

  return (
    <div className="account-group-card">
      <AccountRow
        account={account}
        subAccounts={subAccounts}
        onEdit={onEdit}
        onAddSub={onAddSub}
        onDelete={onDelete}
      />
      {hasSubs ? (
        <>
          <button
            type="button"
            className="account-subs-toggle"
            aria-expanded={subsOpen}
            onClick={() => setSubsOpen((open) => !open)}
          >
            <span>{subCountLabel(subAccounts.length)}</span>
            <span className="account-subs-chevron" aria-hidden>
              {subsOpen ? '▲' : '▼'}
            </span>
          </button>
          {subsOpen ? (
            <div className="account-subs-panel">
              {subAccounts.map((sub) => (
                <AccountRow
                  key={sub.id}
                  account={sub}
                  nested
                  onEdit={() => onEditSub(sub.id)}
                  onDelete={() => onDeleteSub(sub.id)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
