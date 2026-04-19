import { format } from "date-fns"

export function formatPKR(amount: number): string {
  const whole = Math.floor(amount)
  const formatted = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return "Rs. " + formatted
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "d MMM yyyy")
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "MMM yyyy")
}
