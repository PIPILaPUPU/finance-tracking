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

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
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
        const res = await fetch('/auth/refresh', {
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

let bootstrapSessionPromise: Promise<boolean> | null = null

/** Used on app load: refresh cookie may exist even when localStorage is empty. */
export function ensureAccessToken(): Promise<boolean> {
  if (getAccessToken()) {
    return Promise.resolve(true)
  }
  if (!bootstrapSessionPromise) {
    bootstrapSessionPromise = refreshAccessToken().finally(() => {
      bootstrapSessionPromise = null
    })
  }
  return bootstrapSessionPromise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.auth !== false && !getAccessToken()) {
    await ensureAccessToken()
  }

  const headers: Record<string, string> = {}
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.auth !== false) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(path, {
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
    const err = payload as { error?: string; message?: string } | null
    throw new ApiError(
      res.status,
      err?.error ?? 'request_failed',
      err?.message ?? `Request failed with status ${res.status}`,
    )
  }

  return payload as T
}
