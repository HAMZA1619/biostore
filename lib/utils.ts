import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCIES } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string) {
  return `${price.toFixed(2)} ${currency}`
}

export function getCurrencySymbol(currency: string) {
  const c = CURRENCIES.find((cur) => cur.code === currency)
  return c?.symbol || currency
}

export function formatPriceSymbol(price: number, currency: string) {
  return `${getCurrencySymbol(currency)} ${price.toFixed(2)}`
}

export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const d = typeof date === "string" ? new Date(date).getTime() : date.getTime()
  const seconds = Math.floor((now - d) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
