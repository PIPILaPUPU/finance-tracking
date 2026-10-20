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

export function cancelExpenses(transactionIds: string[]) {
  return apiRequest<void>('/transactions/cancel', {
    method: 'POST',
    body: { transaction_ids: transactionIds },
  })
}
