import { useState } from 'react'
import type { Release } from '../types'
import { Modal } from './Modal'

interface WhatsNewModalProps {
  release: Release | null
  onAcknowledge: () => Promise<void>
}

export function WhatsNewModal({ release, onAcknowledge }: WhatsNewModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleAcknowledge() {
    setSubmitting(true)
    setError('')
    try {
      await onAcknowledge()
    } catch {
      setError('Не удалось сохранить отметку. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Что нового"
      open={release !== null}
      onClose={() => undefined}
      dismissible={false}
    >
      {release ? (
        <div className="whats-new">
          <span className="whats-new-version">Версия {release.version}</span>
          <h4>{release.title}</h4>
          {release.description ? <p className="whats-new-description">{release.description}</p> : null}
          <ul className="whats-new-list">
            {release.items.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
          {error ? <p className="form-error">{error}</p> : null}
          <button
            type="button"
            className="btn btn-primary whats-new-action"
            disabled={submitting}
            onClick={() => void handleAcknowledge()}
          >
            {submitting ? 'Сохраняем…' : 'Понятно'}
          </button>
        </div>
      ) : null}
    </Modal>
  )
}
