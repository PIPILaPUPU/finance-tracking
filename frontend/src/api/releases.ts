import type { Release } from '../types'
import { apiRequest } from './client'

export function fetchLatestRelease(): Promise<Release> {
  return apiRequest<Release>('/releases/latest')
}

export function markLatestReleaseSeen(): Promise<void> {
  return apiRequest<void>('/releases/seen', { method: 'POST' })
}
