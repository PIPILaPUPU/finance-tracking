import { useState, type FormEvent } from 'react'
import type { Account, Category, CreateTransactionRequest, TransactionType } from '../types'
import { accountLabel } from '../utils/accounts'
import { Modal } from './Modal'

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  accounts: Account[]
  categories: Category[]
  onSubmit: (data: CreateTransactionRequest) => { ok: true } | { ok: false; message: string }
}

export function TransactionFormModal({
  open,
  onClose,
  accounts,
  categories,
  onSubmit,
}: TransactionFormModalProps) {
  const [type, setType] = useState<TransactionType>('expanse')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setType('expanse')
    setAmount('')
    setDescription('')
    setFromAccountId('')
    setToAccountId('')
    setCategoryId('')
    setError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!description.trim()) {
      setError('Добавьте описание')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Сумма должна быть больше 0')
      return
    }

    const result = onSubmit({
      type,
      amount: Math.round(value),
      description: description.trim(),
      from_account_id: fromAccountId || undefined,
      to_account_id: toAccountId || undefined,
      category_id: categoryId || undefined,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    reset()
    onClose()
  }

  return (
    <Modal
      title="Новая операция"
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="type-tabs" role="tablist">
          {(
            [
              ['expanse', 'Расход'],
              ['income', 'Доход'],
              ['transfer', 'Перевод'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`type-tab${type === value ? ' active' : ''}`}
              onClick={() => setType(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="tx-amount">Сумма</label>
          <input
            id="tx-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
          />
        </div>

        <div className="field">
          <label htmlFor="tx-desc">Описание</label>
          <input
            id="tx-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Супермаркет"
          />
        </div>

        {(type === 'expanse' || type === 'transfer') && (
          <div className="field">
            <label htmlFor="tx-from">Счёт списания</label>
            <select
              id="tx-from"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
            >
              <option value="">Выберите счёт</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {accountLabel(accounts, a.id)}
                </option>
              ))}
            </select>
          </div>
        )}

        {(type === 'income' || type === 'transfer') && (
          <div className="field">
            <label htmlFor="tx-to">Счёт зачисления</label>
            <select id="tx-to" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Выберите счёт</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {accountLabel(accounts, a.id)}
                </option>
              ))}
            </select>
          </div>
        )}

        {type !== 'transfer' && (
          <div className="field">
            <label htmlFor="tx-cat">Категория</label>
            <select
              id="tx-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  )
}
