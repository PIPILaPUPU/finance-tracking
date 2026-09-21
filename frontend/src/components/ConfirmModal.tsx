import { useEffect, useState } from 'react'
import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => Promise<{ ok: true } | { ok: false; message: string }>
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setError('')
    }
  }, [open])

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    const result = await onConfirm()
    setSubmitting(false)
    if (result.ok) {
      onClose()
      return
    }
    setError(result.message)
  }

  return (
    <Modal
      title={title}
      open={open}
      onClose={() => {
        if (submitting) return
        onClose()
      }}
    >
      <p className="confirm-message">{message}</p>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
          Отмена
        </button>
        <button type="button" className="btn btn-danger" onClick={() => void handleConfirm()} disabled={submitting}>
          {submitting ? 'Удаляем…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
