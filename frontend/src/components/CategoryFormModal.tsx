import { useEffect, useState, type FormEvent } from 'react'
import type { Category, CategoryRequest } from '../types'
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
} from '../utils/categoryStyle'
import { CATEGORY_ICONS, CategoryIcon } from './CategoryIcons'
import { Modal } from './Modal'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CategoryRequest) => Promise<{ ok: true } | { ok: false; message: string }>
  /** Category being edited, if any. */
  initial?: Category | null
  title?: string
}

export function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initial = null,
  title = 'Новая категория',
}: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [isExpense, setIsExpense] = useState(true)
  const [isIncome, setIsIncome] = useState(false)
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR)
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setIsExpense(initial?.is_expense ?? true)
    setIsIncome(initial?.is_income ?? false)
    setColor(initial?.color ?? DEFAULT_CATEGORY_COLOR)
    setIcon(initial?.icon ?? DEFAULT_CATEGORY_ICON)
    setError('')
    setSubmitting(false)
  }, [open, initial])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Введите название')
      return
    }
    if (!isExpense && !isIncome) {
      setError('Выберите, для чего категория: расходы, доходы или оба варианта')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      name: name.trim(),
      is_expense: isExpense,
      is_income: isIncome,
      color,
      icon,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }
    onClose()
  }

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="category-preview">
          <span className="category-badge" style={{ background: color }} aria-hidden>
            <CategoryIcon name={icon} width={22} height={22} />
          </span>
          <p>{name.trim() || 'Без названия'}</p>
        </div>

        <div className="field">
          <label htmlFor="cat-name">Название</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Продукты"
          />
        </div>

        <div className="field">
          <label>Где использовать</label>
          <div className="checkbox-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={isExpense}
                onChange={(e) => setIsExpense(e.target.checked)}
              />
              Расходы
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={isIncome}
                onChange={(e) => setIsIncome(e.target.checked)}
              />
              Доходы
            </label>
          </div>
        </div>

        <div className="field">
          <label>Иконка</label>
          <div className="icon-picker">
            {CATEGORY_ICONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`icon-option${icon === option.key ? ' active' : ''}`}
                aria-label={option.label}
                aria-pressed={icon === option.key}
                title={option.label}
                style={icon === option.key ? { color, borderColor: color } : undefined}
                onClick={() => setIcon(option.key)}
              >
                <CategoryIcon name={option.key} width={22} height={22} />
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Цвет</label>
          <div className="color-picker">
            {CATEGORY_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                className={`color-option${color === value ? ' active' : ''}`}
                aria-label={`Цвет ${value}`}
                aria-pressed={color === value}
                style={{ background: value }}
                onClick={() => setColor(value)}
              />
            ))}
          </div>
        </div>

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
