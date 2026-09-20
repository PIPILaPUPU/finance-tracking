import type { Currency, TransactionType } from '../types'

const currencySymbols: Partial<Record<Currency, string>> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

export function formatMoney(amount: number, currency: Currency = 'RUB'): string {
  const abs = Math.abs(Math.round(amount))
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const symbol = currencySymbols[currency] ?? currency
  return `${formatted} ${symbol}`
}

export function formatSignedMoney(
  amount: number,
  type: TransactionType,
  currency: Currency = 'RUB',
): string {
  if (type === 'income') return `+${formatMoney(amount, currency)}`
  if (type === 'expanse') return `-${formatMoney(amount, currency)}`
  return formatMoney(amount, currency)
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
