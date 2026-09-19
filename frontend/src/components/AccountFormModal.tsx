import { useEffect, useState, type FormEvent } from 'react'
import type { Account, CreateAccountRequest, Currency } from '../types'
import { getRootAccounts } from '../utils/accounts'
import { Modal } from './Modal'

const CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR', 'GBP', 'CNY']

interface AccountFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateAccountRequest) => void
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
  const [error, setError] = useState('')

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
    setError('')
  }, [open, defaultParentId, accounts])

  const reset = () => {
    setName('')
    setType('card')
    setCurrency('RUB')
    setBalance('0')
    setParentId('')
    setError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(balance)
    if (!name.trim()) {
      setError('Укажите название счёта')
      return
    }
    if (!type.trim()) {
      setError('Укажите тип счёта')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Баланс должен быть больше 0')
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

    onSubmit({
      name: name.trim(),
      type: parentId ? 'subaccount' : type.trim(),
      currency: parent?.currency ?? currency,
      balance: Math.round(amount),
      parent_id: parentId || null,
    })
    reset()
    onClose()
  }

  const isSub = Boolean(parentId)

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
                const parent = accounts.find((a) => a.id === next)
                if (parent) {
                  setCurrency(parent.currency)
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
            placeholder={isSub ? 'Отпуск' : 'Tinkoff Black'}
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
        <div className="field">
          <label htmlFor="acc-balance">Баланс</label>
          <input
            id="acc-balance"
            type="number"
            min={1}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Добавить
          </button>
        </div>
      </form>
    </Modal>
  )
}
