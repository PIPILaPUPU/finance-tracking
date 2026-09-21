import type {
  Account,
  CreateAccountRequest,
  UpdateAccountNameRequest,
  UpdateSubAccountRequest,
} from '../types'
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

export function updateAccountName(id: string, data: UpdateAccountNameRequest) {
  return apiRequest<Account>(`/accounts/${id}/name`, {
    method: 'PATCH',
    body: data,
  })
}

export function updateSubAccountAllocation(id: string, data: UpdateSubAccountRequest) {
  return apiRequest<Account>(`/accounts/${id}/allocation`, {
    method: 'PATCH',
    body: data,
  })
}

export function deleteAccount(id: string) {
  return apiRequest<string>(`/accounts/${id}`, { method: 'DELETE' })
}
