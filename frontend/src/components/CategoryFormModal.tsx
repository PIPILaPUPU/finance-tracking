import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './Modal'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (
    name: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }> | void
  initialName?: string
  title?: string
}

export function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initialName = '',
  title = 'Новая категория',
}: CategoryFormModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError('')
      setSubmitting(false)
    }
  }, [open, initialName])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Введите название')
      return
    }
    setSubmitting(true)
    const result = await onSubmit(name.trim())
    setSubmitting(false)
    if (result && !result.ok) {
      setError(result.message)
      return
    }
    setName('')
    setError('')
    onClose()
  }

  return (
    <Modal
      title={title}
      open={open}
      onClose={() => {
        setName(initialName)
        setError('')
        onClose()
      }}
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="cat-name">Название</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Продукты"
          />
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
