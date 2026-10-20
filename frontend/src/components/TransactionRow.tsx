import type { Category, Transaction } from '../types'
import { formatDate, formatSignedMoney } from '../utils/format'
import { CategoryIcon } from './CategoryIcons'

interface TransactionRowProps {
  transaction: Transaction
  category?: Category
  selectable?: boolean
  selected?: boolean
  dimmed?: boolean
  onToggle?: () => void
}

export function TransactionRow({
  transaction,
  category,
  selectable = false,
  selected = false,
  dimmed = false,
  onToggle,
}: TransactionRowProps) {
  const color = category?.color ?? (transaction.type === 'income' ? '#22C55E' : '#5B4BFF')
  return (
    <article
      className={`tx-row${selectable ? ' selectable' : ''}${selected ? ' selected' : ''}${dimmed ? ' dimmed' : ''}`}
      onClick={selectable ? onToggle : undefined}
      onKeyDown={
        selectable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle?.()
              }
            }
          : undefined
      }
      role={selectable ? 'checkbox' : undefined}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      <div className="tx-icon" style={{ background: color }}>
        <CategoryIcon name={category?.icon} width={18} height={18} />
      </div>
      <div className="tx-body">
        <h4>{transaction.description || category?.name || 'Операция'}</h4>
        <p>
          {category?.name ?? (transaction.type === 'transfer' ? 'Перевод' : 'Без категории')}
          {' · '}
          {formatDate(transaction.created_at)}
        </p>
      </div>
      <div className={`tx-amount ${transaction.type}`}>
        {formatSignedMoney(transaction.amount, transaction.type)}
      </div>
      {selectable ? (
        <input
          className="tx-select-checkbox"
          type="checkbox"
          checked={selected}
          aria-label={`Выбрать операцию ${transaction.description || category?.name || ''}`}
          onClick={(event) => event.stopPropagation()}
          onChange={onToggle}
        />
      ) : null}
    </article>
  )
}
