import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './Modal'

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
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

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError('')
    }
  }, [open, initialName])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Введите название')
      return
    }
    onSubmit(name.trim())
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
          <button type="submit" className="btn btn-primary">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  )
}
