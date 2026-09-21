import { useEffect, useState, type FormEvent } from 'react'
import type { Account, AllocationRule, UpdateAccountRequest } from '../types'
import { formatMoney, parseMoneyInput, toMajor } from '../utils/format'
import { Modal } from './Modal'

interface EditAccountModalProps {
  open: boolean
  account: Account | null
  accounts: Account[]
  onClose: () => void
  onSubmit: (
    id: string,
    data: UpdateAccountRequest,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
}

export function EditAccountModal({
  open,
  account,
  accounts,
  onClose,
  onSubmit,
}: EditAccountModalProps) {
  const isSub = Boolean(account?.parent_id)
  const parent = account?.parent_id
    ? accounts.find((a) => a.id === account.parent_id)
    : null

  const [name, setName] = useState('')
  const [allocationRule, setAllocationRule] = useState<AllocationRule>('manual')
  const [balance, setBalance] = useState('')
  const [percent, setPercent] = useState('20')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !account) return
    setName(account.name)
    setAllocationRule((account.allocation_rule as AllocationRule) || 'manual')
    setBalance(String(toMajor(account.balance)))
    setPercent(String(account.percent ?? 20))
    setError('')
    setSubmitting(false)
  }, [open, account])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!account) return
    if (!name.trim()) {
      setError('Укажите название счёта')
      return
    }

    const payload: UpdateAccountRequest = { name: name.trim() }

    if (isSub) {
      payload.allocation_rule = allocationRule
      if (allocationRule === 'percent') {
        const percentValue = Number(percent)
        if (!Number.isFinite(percentValue) || percentValue < 1 || percentValue > 100) {
          setError('Процент должен быть от 1 до 100')
          return
        }
        payload.percent = percentValue
      } else {
        const amountMinor = parseMoneyInput(balance)
        if (amountMinor === null || amountMinor <= 0) {
          setError('Сумма должна быть больше 0 (можно с копейками, например 1000.50)')
          return
        }
        payload.balance = amountMinor
        payload.percent = null
      }
    }

    setSubmitting(true)
    setError('')
    const result = await onSubmit(account.id, payload)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onClose()
  }

  const previewPercentAmount =
    isSub && allocationRule === 'percent' && parent
      ? Math.round((parent.balance * Number(percent || 0)) / 100)
      : null

  return (
    <Modal
      title={isSub ? 'Редактировать субсчёт' : 'Редактировать счёт'}
      open={open}
      onClose={onClose}
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="edit-acc-name">Название</label>
          <input
            id="edit-acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {isSub ? (
          <>
            <div className="field">
              <label htmlFor="edit-acc-rule">Правило распределения</label>
              <select
                id="edit-acc-rule"
                value={allocationRule}
                onChange={(e) => setAllocationRule(e.target.value as AllocationRule)}
              >
                <option value="manual">Вручную (сумма)</option>
                <option value="percent">Процент от основного счёта</option>
              </select>
            </div>
            {allocationRule === 'percent' ? (
              <div className="field">
                <label htmlFor="edit-acc-percent">Процент</label>
                <input
                  id="edit-acc-percent"
                  type="number"
                  min={1}
                  max={100}
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                />
                {previewPercentAmount !== null && parent ? (
                  <p className="field-hint">
                    Будет выделено: {formatMoney(previewPercentAmount, parent.currency)}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="field">
                <label htmlFor="edit-acc-balance">Сумма субсчёта</label>
                <input
                  id="edit-acc-balance"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            )}
          </>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
