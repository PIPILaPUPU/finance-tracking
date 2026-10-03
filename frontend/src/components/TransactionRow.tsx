import type { Category, Transaction } from '../types'
import { formatDate, formatSignedMoney } from '../utils/format'
import { CategoryIcon } from './CategoryIcons'

interface TransactionRowProps {
  transaction: Transaction
  category?: Category
}

export function TransactionRow({ transaction, category }: TransactionRowProps) {
  const color = category?.color ?? (transaction.type === 'income' ? '#22C55E' : '#5B4BFF')
  return (
    <article className="tx-row">
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
    </article>
  )
}
