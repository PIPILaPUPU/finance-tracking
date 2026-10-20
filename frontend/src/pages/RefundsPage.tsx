import { useMemo, useState } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { TransactionRow } from '../components/TransactionRow'
import { useFinance } from '../context/FinanceContext'
import { formatMoney } from '../utils/format'

export function RefundsPage() {
  const { categories, transactions, loading, error, cancelExpenses } = useFinance()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const expenses = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'expanse'),
    [transactions],
  )
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const selectedTransactions = useMemo(
    () => expenses.filter((transaction) => selectedIds.has(transaction.id)),
    [expenses, selectedIds],
  )
  const selectedTotal = selectedTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  )

  function toggleTransaction(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selectedTransactions.length

  return (
    <div className={selectedCount > 0 ? 'refund-page has-selection' : 'refund-page'}>
      <h1 className="page-title">Отмена операций</h1>
      <p className="page-subtitle">Выберите расходы, которые хотите отменить</p>

      {loading ? <p className="page-subtitle">Загрузка…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="tx-list refund-list">
        {!loading && expenses.length === 0 ? (
          <div className="empty">
            <p>Расходов для отмены нет</p>
          </div>
        ) : (
          expenses.map((transaction) => {
            const selected = selectedIds.has(transaction.id)
            return (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={categoryMap.get(transaction.category_id)}
                selectable
                selected={selected}
                dimmed={selectedCount > 0 && !selected}
                onToggle={() => toggleTransaction(transaction.id)}
              />
            )
          })
        )}
      </div>

      {selectedCount > 0 ? (
        <div className="refund-action-bar">
          <div>
            <strong>
              {selectedCount} шт. · {formatMoney(selectedTotal)}
            </strong>
            <span>Будет возвращено на счета</span>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setConfirmOpen(true)}
          >
            Отменить выбранные
          </button>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmOpen}
        title="Отменить выбранные расходы?"
        message={`На счета вернётся ${formatMoney(selectedTotal)}. Выбранные операции (${selectedCount}) исчезнут из расходов и аналитики.`}
        confirmLabel="Отменить операции"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const result = await cancelExpenses(selectedTransactions.map((transaction) => transaction.id))
          if (result.ok) setSelectedIds(new Set())
          return result
        }}
      />
    </div>
  )
}
