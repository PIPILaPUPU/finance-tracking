import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, getAccessToken, setAccessToken } from '../api/client'
import { fetchMe, loginRequest, logoutRequest, registerRequest } from '../api/auth'
import type { LoginRequest, RegisterRequest, User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  bootstrapping: boolean
  login: (data: LoginRequest) => Promise<{ ok: true } | { ok: false; message: string }>
  register: (data: RegisterRequest) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === 'invalid_credentials') return 'Неверный email или пароль'
    if (err.code === 'username_exists') return 'Такой логин уже занят'
    if (err.code === 'email_exists') return 'Такой email уже зарегистрирован'
    return err.message || fallback
  }
  return fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) setBootstrapping(false)
        return
      }

      try {
        const me = await fetchMe()
        if (!cancelled) setUser(me)
      } catch {
        setAccessToken(null)
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    try {
      await loginRequest(data)
      const me = await fetchMe()
      setUser(me)
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapAuthError(err, 'Не удалось войти') }
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      await registerRequest(data)
      const me = await fetchMe()
      setUser(me)
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, message: mapAuthError(err, 'Не удалось зарегистрироваться') }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      setAccessToken(null)
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      bootstrapping,
      login,
      register,
      logout,
    }),
    [user, bootstrapping, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
