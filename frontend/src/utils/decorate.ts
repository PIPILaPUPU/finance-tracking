import type { Account, Category, Transaction } from '../types'
import { DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON } from './categoryStyle'

const ACCOUNT_COLORS = ['#FF8A3D', '#22C55E', '#3B5BDB', '#EC4899', '#8B5CF6', '#14B8A6']

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

/** Guards against rows created before colour/icon became part of the API. */
export function decorateCategory(category: Category): Category {
  return {
    ...category,
    color: category.color || DEFAULT_CATEGORY_COLOR,
    icon: category.icon || DEFAULT_CATEGORY_ICON,
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
