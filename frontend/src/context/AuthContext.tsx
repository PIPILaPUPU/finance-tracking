import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_USER } from '../data/mock'
import type { LoginRequest, RegisterRequest, User } from '../types'

const AUTH_KEY = 'ft_auth_user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<{ ok: true } | { ok: false; message: string }>
  register: (data: RegisterRequest) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadUser())

  const login = useCallback(async (data: LoginRequest) => {
    await new Promise((r) => setTimeout(r, 350))
    if (!data.email.trim() || !data.password.trim()) {
      return { ok: false as const, message: 'Введите email и пароль' }
    }
    if (data.password.length < 8) {
      return { ok: false as const, message: 'Пароль должен быть не короче 8 символов' }
    }
    const next: User = {
      ...MOCK_USER,
      email: data.email.trim(),
      username: data.email.split('@')[0] || MOCK_USER.username,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(next))
    setUser(next)
    return { ok: true as const }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    await new Promise((r) => setTimeout(r, 350))
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(data.username)) {
      return {
        ok: false as const,
        message: 'Логин: 3–32 символа, латиница, цифры или _',
      }
    }
    if (!data.email.includes('@')) {
      return { ok: false as const, message: 'Некорректный email' }
    }
    if (data.password.length < 8 || data.password.length > 72) {
      return { ok: false as const, message: 'Пароль: 8–72 символа' }
    }
    const now = new Date().toISOString()
    const next: User = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      username: data.username,
      email: data.email.trim(),
      created_at: now,
      updated_at: now,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(next))
    setUser(next)
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
