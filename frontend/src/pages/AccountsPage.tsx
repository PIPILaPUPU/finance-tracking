import { useMemo, useState } from 'react'
import { AccountFormModal } from '../components/AccountFormModal'
import { AccountGroup } from '../components/AccountCard'
import { ConfirmModal } from '../components/ConfirmModal'
import { EditAccountModal } from '../components/EditAccountModal'
import { useFinance } from '../context/FinanceContext'
import type { Account } from '../types'
import { getRootAccounts, getSubAccounts } from '../utils/accounts'
import { formatMoney } from '../utils/format'

export function AccountsPage() {
  const { accounts, totalBalance, addAccount, updateAccount, removeAccount, loading, error } =
    useFinance()
  const [open, setOpen] = useState(false)
  const [parentForSub, setParentForSub] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [actionError, setActionError] = useState('')

  const roots = useMemo(() => getRootAccounts(accounts), [accounts])
  const editing = editId ? accounts.find((a) => a.id === editId) ?? null : null

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
              <AccountGroup
                key={account.id}
                account={account}
                subAccounts={subs}
                onEdit={() => setEditId(account.id)}
                onAddSub={() => {
                  setParentForSub(account.id)
                  setOpen(true)
                }}
                onDelete={() => setDeleteTarget(account)}
                onEditSub={(subId) => setEditId(subId)}
                onDeleteSub={(subId) => {
                  const sub = accounts.find((item) => item.id === subId)
                  if (sub) setDeleteTarget(sub)
                }}
              />
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
        accounts={accounts}
        onClose={() => setEditId(null)}
        onSubmit={updateAccount}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.parent_id ? 'Удалить субсчёт?' : 'Удалить счёт?'}
        message={
          deleteTarget
            ? deleteTarget.parent_id
              ? `Вы уверены, что хотите удалить субсчёт «${deleteTarget.name}»? Это действие нельзя отменить.`
              : getSubAccounts(accounts, deleteTarget.id).length > 0
                ? `Вы уверены, что хотите удалить счёт «${deleteTarget.name}»? Все субсчета также будут удалены.`
                : `Вы уверены, что хотите удалить счёт «${deleteTarget.name}»? Это действие нельзя отменить.`
            : ''
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return { ok: false as const, message: 'Счёт не найден' }
          const result = await removeAccount(deleteTarget.id)
          if (!result.ok) setActionError(result.message)
          return result
        }}
      />
    </>
  )
}
