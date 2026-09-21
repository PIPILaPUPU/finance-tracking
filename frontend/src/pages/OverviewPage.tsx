import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountCard } from '../components/AccountCard'
import { BalanceCard } from '../components/BalanceCard'
import { ExpenseChart } from '../components/ExpenseChart'
import { IconBell, IconPlus } from '../components/Icons'
import { TransactionFormModal } from '../components/TransactionFormModal'
import { TransactionRow } from '../components/TransactionRow'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { getRootAccounts, getSubAccounts } from '../utils/accounts'
import { greetingByTime } from '../utils/format'

export function OverviewPage() {
  const { user } = useAuth()
  const {
    accounts,
    categories,
    transactions,
    weeklyExpenses,
    totalBalance,
    monthIncome,
    monthExpense,
    addTransaction,
  } = useFinance()
  const [txOpen, setTxOpen] = useState(false)

  const recent = useMemo(() => transactions.slice(0, 5), [transactions])
  const rootAccounts = useMemo(() => getRootAccounts(accounts), [accounts])
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  return (
    <>
      <header className="overview-header">
        <div className="user-chip">
          <p className="greeting">{greetingByTime()} 👋</p>
          <p className="name">{user?.username ?? 'Гость'}</p>
        </div>
        <button type="button" className="icon-btn" aria-label="Уведомления">
          <IconBell width={20} height={20} />
        </button>
      </header>

      <BalanceCard total={totalBalance} income={monthIncome} expense={monthExpense} />

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Мои счета</h2>
          <Link className="link-btn" to="/accounts">
            + Добавить
          </Link>
        </div>
        <div className="accounts-scroll">
          {rootAccounts.map((account) => {
            const subs = getSubAccounts(accounts, account.id)
            return (
              <AccountCard
                key={account.id}
                account={account}
                subAccounts={subs}
                subCount={subs.length}
              />
            )
          })}
        </div>
      </section>

      <section className="section">
        <ExpenseChart values={weeklyExpenses} />
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title plain">Последние операции</h2>
          <Link className="link-btn" to="/transactions">
            Все
          </Link>
        </div>
        <div className="tx-list">
          {recent.length === 0 ? (
            <div className="empty">
              <p>Пока нет операций</p>
            </div>
          ) : (
            recent.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                category={categoryMap.get(tx.category_id)}
              />
            ))
          )}
        </div>
      </section>

      <button
        type="button"
        className="fab"
        aria-label="Добавить операцию"
        onClick={() => setTxOpen(true)}
      >
        <IconPlus width={24} height={24} />
      </button>

      <TransactionFormModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        accounts={accounts}
        categories={categories}
        onSubmit={addTransaction}
      />
    </>
  )
}
