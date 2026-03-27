import { format, parseISO } from 'date-fns'

export function formatCurrency(amount: number, symbol = 'Rs.'): string {
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Math.abs(amount))
  return amount < 0 ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`
}

export function formatDate(dateStr: string | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), pattern)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a')
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-PK').format(num)
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}
