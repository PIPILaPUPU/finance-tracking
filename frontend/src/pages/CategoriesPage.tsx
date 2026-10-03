import { useState } from 'react'
import { CategoryFormModal } from '../components/CategoryFormModal'
import { CategoryIcon } from '../components/CategoryIcons'
import { IconTrash } from '../components/Icons'
import { useFinance } from '../context/FinanceContext'
import { categoryKindLabel } from '../utils/categoryStyle'

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, removeCategory, loading, error } = useFinance()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const editing = categories.find((c) => c.id === editId) ?? null

  return (
    <>
      <h1 className="page-title">Категории</h1>
      <p className="page-subtitle">Для доходов и расходов</p>
      {loading ? <p className="page-subtitle">Загрузка…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {actionError ? <p className="form-error">{actionError}</p> : null}

      <div className="page-actions">
        <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          + Добавить категорию
        </button>
      </div>

      <div className="category-grid">
        {categories.length === 0 ? (
          <div className="empty">
            <p>Категорий пока нет</p>
          </div>
        ) : (
          categories.map((category) => (
            <article key={category.id} className="category-item">
              <span className="category-badge" style={{ background: category.color }} aria-hidden>
                <CategoryIcon name={category.icon} width={20} height={20} />
              </span>
              <button
                type="button"
                className="category-meta"
                onClick={() => setEditId(category.id)}
              >
                <span className="name">{category.name}</span>
                <span className="kind">{categoryKindLabel(category)}</span>
              </button>
              <div className="category-item-actions">
                <button
                  type="button"
                  className="icon-action"
                  aria-label={`Редактировать ${category.name}`}
                  onClick={() => setEditId(category.id)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-action danger"
                  aria-label={`Удалить ${category.name}`}
                  onClick={async () => {
                    const result = await removeCategory(category.id)
                    if (!result.ok) setActionError(result.message)
                  }}
                >
                  <IconTrash width={16} height={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <CategoryFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={addCategory}
      />

      <CategoryFormModal
        open={Boolean(editing)}
        title="Изменить категорию"
        initial={editing}
        onClose={() => setEditId(null)}
        onSubmit={async (data) => {
          if (!editId) return { ok: false as const, message: 'Категория не найдена' }
          return updateCategory(editId, data)
        }}
      />
    </>
  )
}
