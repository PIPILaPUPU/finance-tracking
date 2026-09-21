import type { Account, CreateAccountRequest, UpdateAccountRequest } from '../types'
import { apiRequest } from './client'

export function listAccounts() {
  return apiRequest<Account[]>('/accounts')
}

export function createAccount(data: CreateAccountRequest) {
  return apiRequest<Account>('/accounts', {
    method: 'POST',
    body: data,
  })
}

export function updateAccount(id: string, data: UpdateAccountRequest) {
  return apiRequest<Account>(`/accounts/${id}`, {
    method: 'PATCH',
    body: data,
  })
}

export function deleteAccount(id: string) {
  return apiRequest<string>(`/accounts/${id}`, { method: 'DELETE' })
}
