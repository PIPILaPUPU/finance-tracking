import { useMemo, useState } from 'react'
import { IconPlus } from '../components/Icons'
import { TransactionFormModal } from '../components/TransactionFormModal'
import { TransactionRow } from '../components/TransactionRow'
import { useFinance } from '../context/FinanceContext'

export function TransactionsPage() {
  const { accounts, categories, transactions, addTransaction } = useFinance()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'expanse' | 'income' | 'transfer'>('all')

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const filtered = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)),
    [transactions, filter],
  )

  return (
    <>
      <h1 className="page-title">Операции</h1>
      <p className="page-subtitle">Расходы, доходы и переводы</p>

      <div className="type-tabs" style={{ marginBottom: 16 }}>
        {(
          [
            ['all', 'Все'],
            ['expanse', 'Расход'],
            ['income', 'Доход'],
            ['transfer', 'Перевод'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`type-tab${filter === value ? ' active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tx-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <p>Операций нет</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              category={categoryMap.get(tx.category_id)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        className="fab"
        aria-label="Добавить операцию"
        onClick={() => setOpen(true)}
      >
        <IconPlus width={24} height={24} />
      </button>

      <TransactionFormModal
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        categories={categories}
        onSubmit={addTransaction}
      />
    </>
  )
}
