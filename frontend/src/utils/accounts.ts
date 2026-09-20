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

export function accountLabel(accounts: Account[], id: string): string {
  const account = accounts.find((a) => a.id === id)
  if (!account) return 'Счёт'
  if (!account.parent_id) return account.name
  const parent = accounts.find((a) => a.id === account.parent_id)
  return parent ? `${parent.name} · ${account.name}` : account.name
}
