import { useState } from 'react'
import { CategoryFormModal } from '../components/CategoryFormModal'
import { IconTrash } from '../components/Icons'
import { useFinance } from '../context/FinanceContext'

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, removeCategory } = useFinance()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const editing = categories.find((c) => c.id === editId)

  return (
    <>
      <h1 className="page-title">Категории</h1>
      <p className="page-subtitle">Для доходов и расходов</p>

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
              <div
                className="category-dot"
                style={{ background: category.color ?? '#5B4BFF' }}
                aria-hidden
              >
                {category.name.slice(0, 1).toUpperCase()}
              </div>
              <button
                type="button"
                className="name"
                onClick={() => setEditId(category.id)}
                style={{ textAlign: 'left' }}
              >
                {category.name}
              </button>
              <button
                type="button"
                className="icon-action danger"
                aria-label={`Удалить ${category.name}`}
                onClick={() => removeCategory(category.id)}
              >
                <IconTrash width={16} height={16} />
              </button>
            </article>
          ))
        )}
      </div>

      <CategoryFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(name) => addCategory({ name })}
      />

      <CategoryFormModal
        open={Boolean(editing)}
        title="Изменить категорию"
        initialName={editing?.name ?? ''}
        onClose={() => setEditId(null)}
        onSubmit={(name) => {
          if (editId) updateCategory(editId, name)
        }}
      />
    </>
  )
}
