import type { Lang } from './types'

export const DAY = 86_400_000
export const HOUR = 3_600_000

const LOCALE: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN' }

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(s: string, n: number): string {
  const d = parseIso(s)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

export function todayIso(): string {
  return isoDate(new Date())
}

export function fmtDay(s: string, lang: Lang): string {
  return parseIso(s).toLocaleDateString(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtDateTime(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleString(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fmtDate(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric' })
}

const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })

export function num(n: number, digits: 0 | 1 = 0): string {
  if (!Number.isFinite(n)) return '–'
  return (digits === 1 ? nf1 : nf0).format(n)
}

export function kgNum(n: number): string {
  if (!Number.isFinite(n)) return '–'
  const a = Math.abs(n)
  if (a >= 10000) return `${nf1.format(n / 1000)} t`
  return a < 100 ? nf1.format(n) : nf0.format(n)
}

export function fmtKg(n: number): string {
  const s = kgNum(n)
  return s.endsWith(' t') ? s : `${s} kg`
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return '–'
  return `${Math.round(n * 100)}%`
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function maskPhone(p: string): string {
  const digits = p.replace(/\D/g, '')
  if (digits.length < 6) return p
  return `${digits.slice(0, 2)}xxx xx${digits.slice(-3)}`
}
