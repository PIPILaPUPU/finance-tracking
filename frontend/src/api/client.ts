export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const TOKEN_KEY = 'ft_access_token'
const API_PREFIX = '/api'

function apiPath(path: string): string {
  return path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path}`
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function isAccessTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number }
    if (!payload.exp) return true
    return payload.exp * 1000 <= Date.now() + 30_000
  } catch {
    return true
  }
}

function hasValidAccessToken(): boolean {
  const token = getAccessToken()
  return Boolean(token && !isAccessTokenExpired(token))
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  retry?: boolean
}

type SessionExpiredListener = () => void

const sessionExpiredListeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

function notifySessionExpired() {
  setAccessToken(null)
  for (const listener of sessionExpiredListeners) {
    listener()
  }
}

let refreshPromise: Promise<boolean> | null = null

/** Restore access token from the httpOnly refresh cookie. */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(apiPath('/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
        })
        if (!res.ok) {
          return false
        }
        const data = (await res.json()) as { access_token?: string }
        if (!data.access_token) {
          return false
        }
        setAccessToken(data.access_token)
        return true
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

let refreshInFlight: Promise<boolean> | null = null

function refreshIfNeeded(): Promise<boolean> {
  if (hasValidAccessToken()) {
    return Promise.resolve(true)
  }
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** Ensures a valid access token before authenticated API calls. */
export function ensureAccessToken(): Promise<boolean> {
  return refreshIfNeeded()
}

let sessionInitPromise: Promise<boolean> | null = null

/** Called once on page load — restore session from httpOnly refresh cookie. */
export function bootstrapSession(): Promise<boolean> {
  if (!sessionInitPromise) {
    sessionInitPromise = (async () => {
      await refreshAccessToken()
      return hasValidAccessToken()
    })()
  }
  return sessionInitPromise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.auth !== false) {
    await ensureAccessToken()
    const token = getAccessToken()
    if (!token) {
      notifySessionExpired()
      throw new ApiError(401, 'invalid_token', 'Bearer token is required')
    }
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(apiPath(path), {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  })

  if (res.status === 401 && options.auth !== false && options.retry !== false) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: false })
    }
    notifySessionExpired()
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }

  if (!res.ok) {
    const err = payload as { error?: string; code?: string; message?: string } | null
    throw new ApiError(
      res.status,
      err?.error ?? err?.code ?? 'request_failed',
      err?.message ?? `Request failed with status ${res.status}`,
    )
  }

  return payload as T
}
