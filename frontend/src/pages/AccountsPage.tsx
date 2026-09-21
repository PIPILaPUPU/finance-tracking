import { useMemo, useState } from 'react'
import { AccountFormModal } from '../components/AccountFormModal'
import { AccountRow } from '../components/AccountCard'
import { EditAccountModal } from '../components/EditAccountModal'
import { useFinance } from '../context/FinanceContext'
import type { Account } from '../types'
import { getRootAccounts, getSubAccounts } from '../utils/accounts'
import { formatMoney } from '../utils/format'

export function AccountsPage() {
  const {
    accounts,
    totalBalance,
    addAccount,
    updateAccountName,
    updateSubAccount,
    removeAccount,
    loading,
    error,
  } = useFinance()
  const [open, setOpen] = useState(false)
  const [parentForSub, setParentForSub] = useState<string | null>(null)
  const [editing, setEditing] = useState<Account | null>(null)
  const [actionError, setActionError] = useState('')

  const roots = useMemo(() => getRootAccounts(accounts), [accounts])
  const editingParent = editing?.parent_id
    ? accounts.find((a) => a.id === editing.parent_id) ?? null
    : null

  return (
    <>
      <h1 className="page-title">Счета</h1>
      <p className="page-subtitle">Всего: {formatMoney(totalBalance)}</p>
      {loading ? <p className="page-subtitle">Загрузка…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}

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
                  onEdit={() => setEditing(account)}
                  onAddSub={() => {
                    setParentForSub(account.id)
                    setOpen(true)
                  }}
                  onDelete={async () => {
                    const result = await removeAccount(account.id)
                    if (!result.ok) setActionError(result.message)
                  }}
                />
                {subs.map((sub) => (
                  <AccountRow
                    key={sub.id}
                    account={sub}
                    nested
                    onEdit={() => setEditing(sub)}
                    onDelete={async () => {
                      const result = await removeAccount(sub.id)
                      if (!result.ok) setActionError(result.message)
                    }}
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

      <EditAccountModal
        open={Boolean(editing)}
        account={editing}
        parent={editingParent}
        onClose={() => setEditing(null)}
        onRename={updateAccountName}
        onUpdateAllocation={updateSubAccount}
      />
    </>
  )
}
