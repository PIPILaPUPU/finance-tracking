export const DEFAULT_CATEGORY_COLOR = '#5B4BFF'
export const DEFAULT_CATEGORY_ICON = 'tag'

/** Palette offered in the category form. */
export const CATEGORY_COLORS = [
  '#FF8A3D',
  '#F97316',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#6366F1',
  '#5B4BFF',
  '#3B5BDB',
  '#0EA5E9',
  '#14B8A6',
  '#22C55E',
  '#84CC16',
  '#64748B',
]

export function categoryKindLabel(category: { is_expense: boolean; is_income: boolean }): string {
  if (category.is_expense && category.is_income) return 'Расход и доход'
  if (category.is_income) return 'Доход'
  return 'Расход'
}
