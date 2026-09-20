import type { Account, Category, Transaction } from '../types'

const ACCOUNT_COLORS = ['#FF8A3D', '#22C55E', '#3B5BDB', '#EC4899', '#8B5CF6', '#14B8A6']
const CATEGORY_COLORS = ['#FF8A3D', '#5B4BFF', '#EC4899', '#22C55E', '#8B5CF6', '#F59E0B']

export function decorateAccount(account: Account, index = 0): Account {
  const isSub = Boolean(account.parent_id)
  return {
    ...account,
    parent_id: account.parent_id ?? null,
    color: account.color ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
    icon:
      account.icon ??
      (isSub
        ? 'wallet'
        : account.type === 'cash'
          ? 'cash'
          : account.type === 'savings'
            ? 'piggy'
            : 'card'),
  }
}

export function decorateCategory(category: Category, index = 0): Category {
  return {
    ...category,
    color: category.color ?? CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    icon: category.icon ?? 'cart',
  }
}

export function weeklyExpensesFromTransactions(transactions: Transaction[]): number[] {
  const week = [0, 0, 0, 0, 0, 0, 0]
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))

  for (const tx of transactions) {
    if (tx.type !== 'expanse') continue
    const date = new Date(tx.created_at)
    if (date < start) continue
    const day = (date.getDay() + 6) % 7
    week[day] += tx.amount
  }
  return week
}
