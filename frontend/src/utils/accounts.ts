import type { Account } from '../types'

export function isRootAccount(account: Account): boolean {
  return account.parent_id == null
}

export function getRootAccounts(accounts: Account[]): Account[] {
  return accounts.filter(isRootAccount)
}

export function getSubAccounts(accounts: Account[], parentId: string): Account[] {
  return accounts.filter((a) => a.parent_id === parentId)
}

/** Sum reserved on manual sub-accounts (matches backend debit check). */
export function sumManualSubBalances(subs: Account[]): number {
  return subs
    .filter((sub) => sub.allocation_rule !== 'percent')
    .reduce((total, sub) => total + sub.balance, 0)
}

/** Free balance on a root account after manual sub-accounts; null if nothing to show. */
export function getAvailableBalance(parent: Account, subs: Account[]): number | null {
  if (parent.parent_id) return null

  const reserved = sumManualSubBalances(subs)
  if (reserved <= 0) return null

  return parent.balance - reserved
}

export function accountLabel(accounts: Account[], id: string): string {
  const account = accounts.find((a) => a.id === id)
  if (!account) return 'Счёт'
  if (!account.parent_id) return account.name
  const parent = accounts.find((a) => a.id === account.parent_id)
  return parent ? `${parent.name} · ${account.name}` : account.name
}
