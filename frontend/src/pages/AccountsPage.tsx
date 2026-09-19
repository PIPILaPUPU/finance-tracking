import { useMemo, useState } from 'react'
import { AccountFormModal } from '../components/AccountFormModal'
import { AccountRow } from '../components/AccountCard'
import { useFinance } from '../context/FinanceContext'
import { getRootAccounts, getSubAccounts } from '../utils/accounts'
import { formatMoney } from '../utils/format'

export function AccountsPage() {
  const { accounts, totalBalance, addAccount, removeAccount } = useFinance()
  const [open, setOpen] = useState(false)
  const [parentForSub, setParentForSub] = useState<string | null>(null)

  const roots = useMemo(() => getRootAccounts(accounts), [accounts])

  return (
    <>
      <h1 className="page-title">Счета</h1>
      <p className="page-subtitle">Всего: {formatMoney(totalBalance)}</p>

      <div className="page-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setParentForSub(null)
            setOpen(true)
          }}
        >
          + Добавить счёт
        </button>
      </div>

      <div className="account-list">
        {roots.length === 0 ? (
          <div className="empty">
            <p>Счетов пока нет</p>
          </div>
        ) : (
          roots.map((account) => {
            const subs = getSubAccounts(accounts, account.id)
            return (
              <div key={account.id} className="account-group">
                <AccountRow
                  account={account}
                  onAddSub={() => {
                    setParentForSub(account.id)
                    setOpen(true)
                  }}
                  onDelete={() => removeAccount(account.id)}
                />
                {subs.map((sub) => (
                  <AccountRow
                    key={sub.id}
                    account={sub}
                    nested
                    onDelete={() => removeAccount(sub.id)}
                  />
                ))}
              </div>
            )
          })
        )}
      </div>

      <AccountFormModal
        open={open}
        accounts={accounts}
        defaultParentId={parentForSub}
        onClose={() => {
          setOpen(false)
          setParentForSub(null)
        }}
        onSubmit={addAccount}
      />
    </>
  )
}
