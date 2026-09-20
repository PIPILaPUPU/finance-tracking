import type { Currency, TransactionType } from '../types'

const currencySymbols: Partial<Record<Currency, string>> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

/** API stores money in minor units (kopecks/cents). */
export function toMinor(major: number): number {
  return Math.round(major * 100)
}

export function toMajor(minor: number): number {
  return minor / 100
}

/** Format minor-unit amount as `1 234,56 ₽`. */
export function formatMoney(amountMinor: number, currency: Currency = 'RUB'): string {
  const major = toMajor(Math.abs(amountMinor))
  const formatted = major.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = currencySymbols[currency] ?? currency
  return `${formatted} ${symbol}`
}

export function formatSignedMoney(
  amountMinor: number,
  type: TransactionType,
  currency: Currency = 'RUB',
): string {
  if (type === 'income') return `+${formatMoney(amountMinor, currency)}`
  if (type === 'expanse') return `-${formatMoney(amountMinor, currency)}`
  return formatMoney(amountMinor, currency)
}

export function parseMoneyInput(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  const major = Number(normalized)
  if (!Number.isFinite(major)) return null
  return toMinor(major)
}

export function greetingByTime(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export const ZERO_UUID = '00000000-0000-0000-0000-000000000000'
