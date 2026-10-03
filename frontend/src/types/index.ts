/** Types aligned with backend JSON. */

export type Currency =
  | 'RUB'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CNY'
  | 'JPY'
  | 'CHF'
  | 'CAD'
  | 'AUD'
  | 'NZD'
  | 'HKD'
  | 'SGD'
  | 'KRW'
  | 'INR'
  | 'TRY'
  | 'PLN'
  | 'CZK'
  | 'SEK'
  | 'NOK'
  | 'DKK'

/** Backend spelling is `expanse` (not expense). */
export type TransactionType = 'expanse' | 'income' | 'transfer'
export type AllocationRule = 'manual' | 'percent'

export interface User {
  id: string
  username: string
  email: string
  last_seen_release: string | null
  created_at: string
  updated_at: string
}

export interface ReleaseItem {
  id: string
  text: string
  sort_order: number
}

export interface Release {
  id: string
  version: string
  title: string
  description: string
  created_at: string
  items: ReleaseItem[]
}

export interface Account {
  id: string
  userid: string
  name: string
  type: string
  currency: Currency
  /** Minor units (kopecks/cents). */
  balance: number
  parent_id: string | null
  allocation_rule?: AllocationRule
  percent?: number | null
  created_at: string
  updated_at: string
  /** UI-only: last digits / mask for cards */
  mask?: string
  /** UI-only: accent for icon */
  color?: string
  icon?: 'card' | 'piggy' | 'cash' | 'wallet'
}

export interface Category {
  id: string
  userid: string
  name: string
  /** A category may be used for expenses, income or both. */
  is_expense: boolean
  is_income: boolean
  /** Hex value, e.g. `#5B4BFF`. */
  color: string
  /** Key from CATEGORY_ICONS. */
  icon: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  from_account_id: string
  to_account_id: string
  category_id: string
  /** Minor units (kopecks/cents). */
  amount: number
  description: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface CreateAccountRequest {
  name: string
  type: string
  currency: Currency
  /** Minor units (kopecks/cents). */
  balance: number
  parent_id?: string | null
  allocation_rule?: AllocationRule
  percent?: number | null
}

export interface UpdateAccountRequest {
  name: string
  allocation_rule?: AllocationRule
  /** Minor units (kopecks/cents). */
  balance?: number
  percent?: number | null
}

/** Same shape is used for create and update. */
export interface CategoryRequest {
  name: string
  is_expense: boolean
  is_income: boolean
  color: string
  icon: string
}

export interface CreateTransactionRequest {
  type: TransactionType
  from_account_id?: string
  to_account_id?: string
  category_id?: string
  /** Minor units (kopecks/cents). */
  amount: number
  description: string
}
