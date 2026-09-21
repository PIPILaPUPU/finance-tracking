import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../api/client'
import * as accountsApi from '../api/accounts'
import * as categoriesApi from '../api/categories'
import * as transactionsApi from '../api/transactions'
import type {
  Account,
  Category,
  CreateAccountRequest,
  CreateCategoryRequest,
  CreateTransactionRequest,
  Transaction,
  UpdateSubAccountRequest,
} from '../types'
import { getRootAccounts } from '../utils/accounts'
import {
  decorateAccount,
  decorateCategory,
  weeklyExpensesFromTransactions,
} from '../utils/decorate'
import { useAuth } from './AuthContext'

interface FinanceContextValue {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  weeklyExpenses: number[]
  totalBalance: number
  monthIncome: number
  monthExpense: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addAccount: (
    data: CreateAccountRequest,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  updateAccountName: (
    id: string,
    name: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  updateSubAccount: (
    id: string,
    data: UpdateSubAccountRequest,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  removeAccount: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>
  addCategory: (
    data: CreateCategoryRequest,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  updateCategory: (
    id: string,
    name: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  removeCategory: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>
  addTransaction: (
    data: CreateTransactionRequest,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function mapError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback
  return fallback
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextAccounts, nextCategories, nextTransactions] = await Promise.all([
        accountsApi.listAccounts(),
        categoriesApi.listCategories(),
        transactionsApi.listTransactions(),
      ])
      setAccounts(nextAccounts.map((item, index) => decorateAccount(item, index)))
      setCategories(nextCategories.map((item, index) => decorateCategory(item, index)))
      setTransactions(nextTransactions ?? [])
    } catch (err) {
      setError(mapError(err, 'Не удалось загрузить данные'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    void refresh()
  }, [isAuthenticated, refresh])

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

  const weeklyExpenses = useMemo(
    () => weeklyExpensesFromTransactions(transactions),
    [transactions],
  )

  const addAccount = useCallback(async (data: CreateAccountRequest) => {
    try {
      const created = await accountsApi.createAccount(data)
      setAccounts((prev) => [...prev, decorateAccount(created, prev.length)])
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось создать счёт') }
    }
  }, [])

  const updateAccountName = useCallback(async (id: string, name: string) => {
    try {
      const updated = await accountsApi.updateAccountName(id, { name })
      setAccounts((prev) =>
        prev.map((account, index) =>
          account.id === id ? decorateAccount({ ...account, ...updated }, index) : account,
        ),
      )
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось переименовать счёт') }
    }
  }, [])

  const updateSubAccount = useCallback(async (id: string, data: UpdateSubAccountRequest) => {
    try {
      const updated = await accountsApi.updateSubAccountAllocation(id, data)
      setAccounts((prev) =>
        prev.map((account, index) =>
          account.id === id ? decorateAccount({ ...account, ...updated }, index) : account,
        ),
      )
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось обновить субсчёт') }
    }
  }, [])

  const removeAccount = useCallback(async (id: string) => {
    try {
      await accountsApi.deleteAccount(id)
      setAccounts((prev) => prev.filter((a) => a.id !== id && a.parent_id !== id))
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось удалить счёт') }
    }
  }, [])

  const addCategory = useCallback(async (data: CreateCategoryRequest) => {
    try {
      const created = await categoriesApi.createCategory(data)
      setCategories((prev) => [...prev, decorateCategory(created, prev.length)])
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось создать категорию') }
    }
  }, [])

  const updateCategory = useCallback(async (id: string, name: string) => {
    try {
      const updated = await categoriesApi.updateCategoryRequest(id, { name })
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? decorateCategory({ ...c, ...updated }) : c)),
      )
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось обновить категорию') }
    }
  }, [])

  const removeCategory = useCallback(async (id: string) => {
    try {
      await categoriesApi.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось удалить категорию') }
    }
  }, [])

  const addTransaction = useCallback(async (data: CreateTransactionRequest) => {
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

    try {
      const created = await transactionsApi.createTransaction(data)
      setTransactions((prev) => [created, ...prev])
      const nextAccounts = await accountsApi.listAccounts()
      setAccounts(nextAccounts.map((item, index) => decorateAccount(item, index)))
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapError(err, 'Не удалось создать операцию') }
    }
  }, [])

  const value = useMemo(
    () => ({
      accounts,
      categories,
      transactions,
      weeklyExpenses,
      totalBalance,
      monthIncome,
      monthExpense,
      loading,
      error,
      refresh,
      addAccount,
      updateAccountName,
      updateSubAccount,
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
      weeklyExpenses,
      totalBalance,
      monthIncome,
      monthExpense,
      loading,
      error,
      refresh,
      addAccount,
      updateAccountName,
      updateSubAccount,
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
