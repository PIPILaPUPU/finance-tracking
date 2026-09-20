import type { CreateTransactionRequest, Transaction } from '../types'
import { apiRequest } from './client'

export function listTransactions() {
  return apiRequest<Transaction[]>('/transactions')
}

export function createTransaction(data: CreateTransactionRequest) {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: data,
  })
}
