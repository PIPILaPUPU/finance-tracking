import { useEffect, useState, type FormEvent } from 'react'
import type { Account, AllocationRule, CreateAccountRequest, Currency } from '../types'
import { getRootAccounts } from '../utils/accounts'
import { formatMoney, parseMoneyInput } from '../utils/format'
import { Modal } from './Modal'

const CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR', 'GBP', 'CNY']

interface AccountFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    data: CreateAccountRequest,
  ) => Promise<{ ok: true } | { ok: false; message: string }> | void
  accounts: Account[]
  /** Prefill parent when adding a sub-account from a row */
  defaultParentId?: string | null
}

export function AccountFormModal({
  open,
  onClose,
  onSubmit,
  accounts,
  defaultParentId = null,
}: AccountFormModalProps) {
  const roots = getRootAccounts(accounts)
  const [name, setName] = useState('')
  const [type, setType] = useState('card')
  const [currency, setCurrency] = useState<Currency>('RUB')
  const [balance, setBalance] = useState('0')
  const [parentId, setParentId] = useState<string>('')
  const [allocationRule, setAllocationRule] = useState<AllocationRule>('manual')
  const [percent, setPercent] = useState('20')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setParentId(defaultParentId ?? '')
    if (defaultParentId) {
      const parent = accounts.find((a) => a.id === defaultParentId)
      if (parent) {
        setCurrency(parent.currency)
        setType('subaccount')
      }
    } else {
      setType('card')
      setCurrency('RUB')
    }
    setName('')
    setBalance('0')
    setAllocationRule('manual')
    setPercent('20')
    setError('')
    setSubmitting(false)
  }, [open, defaultParentId, accounts])

  const reset = () => {
    setName('')
    setType('card')
    setCurrency('RUB')
    setBalance('0')
    setParentId('')
    setAllocationRule('manual')
    setPercent('20')
    setError('')
    setSubmitting(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Укажите название счёта')
      return
    }
    if (!type.trim()) {
      setError('Укажите тип счёта')
      return
    }

    const parent = parentId ? accounts.find((a) => a.id === parentId) : null
    if (parentId && !parent) {
      setError('Родительский счёт не найден')
      return
    }
    if (parent?.parent_id) {
      setError('Субсчёт нельзя вложить в другой субсчёт')
      return
    }

    const isSub = Boolean(parentId)
    let amountMinor = 0
    let percentValue: number | null = null

    if (isSub && allocationRule === 'percent') {
      percentValue = Number(percent)
      if (!Number.isFinite(percentValue) || percentValue < 1 || percentValue > 100) {
        setError('Процент должен быть от 1 до 100')
        return
      }
      amountMinor = Math.round(((parent?.balance ?? 0) * percentValue) / 100)
      if (amountMinor <= 0) {
        setError('Процент от баланса родителя должен быть больше 0')
        return
      }
    } else {
      const parsed = parseMoneyInput(balance)
      if (parsed === null || parsed <= 0) {
        setError('Сумма должна быть больше 0 (можно с копейками, например 1000.50)')
        return
      }
      amountMinor = parsed
    }

    setSubmitting(true)
    setError('')
    const result = await onSubmit({
      name: name.trim(),
      type: isSub ? 'subaccount' : type.trim(),
      currency: parent?.currency ?? currency,
      balance: amountMinor,
      parent_id: parentId || null,
      allocation_rule: isSub ? allocationRule : undefined,
      percent: isSub && allocationRule === 'percent' ? percentValue : undefined,
    })
    setSubmitting(false)

    if (result && !result.ok) {
      setError(result.message)
      return
    }

    reset()
    onClose()
  }

  const isSub = Boolean(parentId)
  const parent = parentId ? accounts.find((a) => a.id === parentId) : null
  const previewPercentAmount =
    isSub && allocationRule === 'percent' && parent
      ? Math.round((parent.balance * Number(percent || 0)) / 100)
      : null
  const previewCurrency = parent?.currency ?? currency

  return (
    <Modal
      title={isSub ? 'Новый субсчёт' : 'Новый счёт'}
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="acc-parent">Родительский счёт</label>
          <select
            id="acc-parent"
            value={parentId}
            onChange={(e) => {
              const next = e.target.value
              setParentId(next)
              if (next) {
                const nextParent = accounts.find((a) => a.id === next)
                if (nextParent) {
                  setCurrency(nextParent.currency)
                  setType('subaccount')
                }
              } else {
                setType('card')
              }
            }}
          >
            <option value="">Без родителя (основной счёт)</option>
            {roots.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="acc-name">Название</label>
          <input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isSub ? 'Продукты' : 'Tinkoff Black'}
          />
        </div>
        {!isSub ? (
          <div className="field">
            <label htmlFor="acc-type">Тип</label>
            <select id="acc-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="card">card</option>
              <option value="savings">savings</option>
              <option value="cash">cash</option>
              <option value="wallet">wallet</option>
            </select>
          </div>
        ) : null}
        {!isSub ? (
          <div className="field">
            <label htmlFor="acc-currency">Валюта</label>
            <select
              id="acc-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="field-hint">Валюта как у родителя: {currency}</p>
        )}
        {isSub ? (
          <div className="field">
            <label htmlFor="acc-rule">Правило распределения</label>
            <select
              id="acc-rule"
              value={allocationRule}
              onChange={(e) => setAllocationRule(e.target.value as AllocationRule)}
            >
              <option value="manual">Вручную (сумма)</option>
              <option value="percent">Процент от основного счёта</option>
            </select>
          </div>
        ) : null}
        {isSub && allocationRule === 'percent' ? (
          <div className="field">
            <label htmlFor="acc-percent">Процент</label>
            <input
              id="acc-percent"
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
            {previewPercentAmount !== null ? (
              <p className="field-hint">
                Будет выделено: {formatMoney(previewPercentAmount, previewCurrency)}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="field">
            <label htmlFor="acc-balance">{isSub ? 'Сумма субсчёта' : 'Баланс'}</label>
            <input
              id="acc-balance"
              type="number"
              min={0.01}
              step={0.01}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="1000.50"
            />
          </div>
        )}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Сохраняем…' : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
