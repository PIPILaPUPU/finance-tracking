import { useMemo, useState } from 'react'
import { IconPlus } from '../components/Icons'
import { TransactionFormModal } from '../components/TransactionFormModal'
import { TransactionRow } from '../components/TransactionRow'
import { useFinance } from '../context/FinanceContext'
import { getRootAccounts, getSubAccounts } from '../utils/accounts'

export function TransactionsPage() {
  const { accounts, categories, transactions, addTransaction } = useFinance()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'expanse' | 'income' | 'transfer'>('all')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedSubAccountId, setSelectedSubAccountId] = useState('')

  const rootAccounts = useMemo(() => getRootAccounts(accounts), [accounts])
  const selectedAccount = rootAccounts.find((account) => account.id === selectedAccountId)
  const subAccounts = useMemo(
    () => selectedAccount ? getSubAccounts(accounts, selectedAccount.id) : [],
    [accounts, selectedAccount],
  )
  const selectedSubAccount = subAccounts.find((account) => account.id === selectedSubAccountId)

  const accountIds = useMemo(() => {
    if (!selectedAccount) return null
    if (selectedSubAccount) return new Set([selectedSubAccount.id])
    return new Set([selectedAccount.id, ...subAccounts.map((account) => account.id)])
  }, [selectedAccount, selectedSubAccount, subAccounts])

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const filtered = useMemo(() => transactions.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false
    if (!accountIds) return true
    return accountIds.has(tx.from_account_id) || accountIds.has(tx.to_account_id)
  }), [transactions, filter, accountIds])

  return (
    <>
      <h1 className="page-title">Операции</h1>
      <p className="page-subtitle">Расходы, доходы и переводы</p>

      <div className="transaction-account-filters">
        <div className="field">
          <label htmlFor="transactions-account">Счёт</label>
          <select
            id="transactions-account"
            value={selectedAccount?.id ?? ''}
            onChange={(event) => {
              setSelectedAccountId(event.target.value)
              setSelectedSubAccountId('')
            }}
          >
            <option value="">Все счета</option>
            {rootAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="transactions-sub-account">Субсчёт</label>
          <select
            id="transactions-sub-account"
            value={selectedSubAccount?.id ?? ''}
            disabled={subAccounts.length === 0}
            onChange={(event) => setSelectedSubAccountId(event.target.value)}
          >
            <option value="">{subAccounts.length === 0 ? 'Нет субсчетов' : 'Все субсчета'}</option>
            {subAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>
      </div>

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
            <p>{transactions.length === 0 ? 'Операций нет' : 'По выбранным фильтрам операций нет'}</p>
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
