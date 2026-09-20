import type { LoginRequest, RegisterRequest, User } from '../types'
import { apiRequest, setAccessToken } from './client'

type LoginResponse = {
  username: string
  token: string
  token_type: string
  expires_at: string
}

export async function loginRequest(data: LoginRequest): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: data,
    auth: false,
  })
  setAccessToken(result.token)
  return result
}

export async function registerRequest(data: RegisterRequest): Promise<void> {
  await apiRequest('/auth/register', {
    method: 'POST',
    body: data,
    auth: false,
  })
  await loginRequest({ email: data.email, password: data.password })
}

export async function fetchMe(): Promise<User> {
  return apiRequest<User>('/auth/me')
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}
