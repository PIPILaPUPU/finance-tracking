import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  MOCK_ACCOUNTS,
  MOCK_CATEGORIES,
  MOCK_TRANSACTIONS,
  MOCK_WEEKLY_EXPENSES,
} from '../data/mock'
import type {
  Account,
  Category,
  CreateAccountRequest,
  CreateCategoryRequest,
  CreateTransactionRequest,
  Transaction,
} from '../types'
import { ZERO_UUID, uid } from '../utils/format'
import { getRootAccounts } from '../utils/accounts'
import { useAuth } from './AuthContext'

interface FinanceContextValue {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  weeklyExpenses: number[]
  totalBalance: number
  monthIncome: number
  monthExpense: number
  addAccount: (data: CreateAccountRequest) => void
  removeAccount: (id: string) => void
  addCategory: (data: CreateCategoryRequest) => void
  updateCategory: (id: string, name: string) => void
  removeCategory: (id: string) => void
  addTransaction: (data: CreateTransactionRequest) => { ok: true } | { ok: false; message: string }
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

const ACCOUNT_COLORS = ['#FF8A3D', '#22C55E', '#3B5BDB', '#EC4899', '#8B5CF6', '#14B8A6']
const CATEGORY_COLORS = ['#FF8A3D', '#5B4BFF', '#EC4899', '#22C55E', '#8B5CF6', '#F59E0B']

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? 'user-1'

  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS)
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS)

  const totalBalance = useMemo(
    () => getRootAccounts(accounts).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  )

  const monthIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )

  const monthExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expanse')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )

  const addAccount = useCallback(
    (data: CreateAccountRequest) => {
      const now = new Date().toISOString()
      const parentId = data.parent_id ?? null
      const parent = parentId ? accounts.find((a) => a.id === parentId) : null
      const next: Account = {
        id: uid('acc'),
        userid: userId,
        name: data.name,
        type: parentId ? 'subaccount' : data.type,
        currency: parent?.currency ?? data.currency,
        balance: data.balance,
        parent_id: parentId,
        created_at: now,
        updated_at: now,
        color: parent?.color
          ? parent.color
          : ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
        icon: parentId
          ? 'wallet'
          : data.type === 'cash'
            ? 'cash'
            : data.type === 'savings'
              ? 'piggy'
              : 'card',
      }
      setAccounts((prev) => [...prev, next])
    },
    [accounts, userId],
  )

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id && a.parent_id !== id))
  }, [])

  const addCategory = useCallback(
    (data: CreateCategoryRequest) => {
      const now = new Date().toISOString()
      const next: Category = {
        id: uid('cat'),
        userid: userId,
        name: data.name,
        created_at: now,
        updated_at: now,
        color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
        icon: 'cart',
      }
      setCategories((prev) => [...prev, next])
    },
    [categories.length, userId],
  )

  const updateCategory = useCallback((id: string, name: string) => {
    const now = new Date().toISOString()
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, updated_at: now } : c)),
    )
  }, [])

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addTransaction = useCallback(
    (data: CreateTransactionRequest) => {
      if (data.amount <= 0) {
        return { ok: false as const, message: 'Сумма должна быть больше 0' }
      }
      if (data.type === 'expanse' && !data.from_account_id) {
        return { ok: false as const, message: 'Укажите счёт списания' }
      }
      if (data.type === 'income' && !data.to_account_id) {
        return { ok: false as const, message: 'Укажите счёт зачисления' }
      }
      if (data.type === 'transfer') {
        if (!data.from_account_id || !data.to_account_id) {
          return { ok: false as const, message: 'Укажите оба счёта' }
        }
        if (data.from_account_id === data.to_account_id) {
          return { ok: false as const, message: 'Счета перевода должны отличаться' }
        }
      }

      const now = new Date().toISOString()
      const tx: Transaction = {
        id: uid('tx'),
        user_id: userId,
        type: data.type,
        from_account_id: data.from_account_id ?? ZERO_UUID,
        to_account_id: data.to_account_id ?? ZERO_UUID,
        category_id: data.category_id ?? ZERO_UUID,
        amount: data.amount,
        description: data.description,
        created_at: now,
      }

      setTransactions((prev) => [tx, ...prev])
      setAccounts((prev) =>
        prev.map((acc) => {
          let balance = acc.balance
          if (data.type === 'expanse' && acc.id === data.from_account_id) {
            balance -= data.amount
          }
          if (data.type === 'income' && acc.id === data.to_account_id) {
            balance += data.amount
          }
          if (data.type === 'transfer') {
            if (acc.id === data.from_account_id) balance -= data.amount
            if (acc.id === data.to_account_id) balance += data.amount
          }
          return { ...acc, balance, updated_at: now }
        }),
      )
      return { ok: true as const }
    },
    [userId],
  )

  const value = useMemo(
    () => ({
      accounts,
      categories,
      transactions,
      weeklyExpenses: MOCK_WEEKLY_EXPENSES,
      totalBalance,
      monthIncome,
      monthExpense,
      addAccount,
      removeAccount,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
    }),
    [
      accounts,
      categories,
      transactions,
      totalBalance,
      monthIncome,
      monthExpense,
      addAccount,
      removeAccount,
      addCategory,
      updateCategory,
      removeCategory,
      addTransaction,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
