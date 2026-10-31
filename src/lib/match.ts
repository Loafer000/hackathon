import { WARD } from './data'
import type { AppState, CategoryId, Partner, WasteRequest } from './types'

export type MatchReason = 'not_verified' | 'no_ward' | 'no_category' | 'full' | 'declined'

export interface CollectorMatch {
  partner: Partner
  score: number
  parts: { coverage: number; proximity: number; reliability: number; load: number }
  eligible: boolean
  reasons: MatchReason[]
  covered: CategoryId[]
  missing: CategoryId[]
}

export const WEIGHTS = { coverage: 0.4, proximity: 0.25, reliability: 0.2, load: 0.15 }

export function wardDistance(a: string, b: string): number {
  const wa = WARD[a]
  const wb = WARD[b]
  if (!wa || !wb) return 3
  return Math.hypot(wa.x - wb.x, wa.y - wb.y)
}

const ACTIVE = new Set(['open', 'assigned'])

export function collectorStats(state: AppState, id: string) {
  let completed = 0
  let active = 0
  let declined = 0
  let good = 0
  let rated = 0
  for (const r of state.requests) {
    if (r.declined.includes(id)) declined++
    if (r.collectorId !== id) continue
    if (r.status === 'assigned') active++
    if (r.collectedAt) {
      completed++
      if (r.segregation) {
        rated++
        if (r.segregation === 'good') good++
      }
    }
  }
  const reliability = (completed + 1) / (completed + declined + 2)
  return { completed, active, declined, reliability, goodShare: rated ? good / rated : 0 }
}

function jobsOn(state: AppState, collectorId: string, date: string, excludeId?: string): number {
  return state.requests.filter(
    (r) =>
      r.id !== excludeId &&
      ACTIVE.has(r.status) &&
      r.slot.date === date &&
      (r.collectorId === collectorId || r.offeredTo === collectorId),
  ).length
}

export function requestCategories(req: Pick<WasteRequest, 'items'>): CategoryId[] {
  return [...new Set(req.items.map((i) => i.category))]
}

export function rankCollectors(state: AppState, req: WasteRequest): CollectorMatch[] {
  const cats = requestCategories(req)
  const kgByCat = new Map<CategoryId, number>()
  for (const i of req.items) kgByCat.set(i.category, (kgByCat.get(i.category) ?? 0) + (i.estKg || 1))
  const totalKg = [...kgByCat.values()].reduce((a, b) => a + b, 0) || 1

  return state.partners
    .filter((p) => p.kind === 'collector')
    .map((p) => {
      const covered = cats.filter((c) => p.categories.includes(c))
      const missing = cats.filter((c) => !p.categories.includes(c))
      const coverage = cats.length ? covered.reduce((a, c) => a + (kgByCat.get(c) ?? 0), 0) / totalKg : 1
      const proximity = 1 - Math.min(wardDistance(p.baseWard, req.ward) / 3, 1)
      const stats = collectorStats(state, p.id)
      const jobs = jobsOn(state, p.id, req.slot.date, req.id)
      const load = Math.max(0, 1 - jobs / p.capacity)

      const reasons: MatchReason[] = []
      if (p.status !== 'verified') reasons.push('not_verified')
      if (!p.wards.includes(req.ward)) reasons.push('no_ward')
      if (cats.length && covered.length === 0) reasons.push('no_category')
      if (jobs >= p.capacity) reasons.push('full')
      if (req.declined.includes(p.id)) reasons.push('declined')

      const score = Math.round(
        100 *
          (WEIGHTS.coverage * coverage +
            WEIGHTS.proximity * proximity +
            WEIGHTS.reliability * stats.reliability +
            WEIGHTS.load * load),
      )
      return {
        partner: p,
        score,
        parts: { coverage, proximity, reliability: stats.reliability, load },
        eligible: reasons.length === 0,
        reasons,
        covered,
        missing,
      }
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score)
}

export interface FacilityMatch {
  partner: Partner
  score: number
  parts: { proximity: number; price: number; headroom: number }
  eligible: boolean
  rate: number
}

export function rankFacilities(state: AppState, category: CategoryId, fromWard: string): FacilityMatch[] {
  const candidates = state.partners.filter((p) => p.kind === 'facility' && p.categories.includes(category))
  const maxRate = Math.max(1, ...candidates.map((p) => p.rates?.[category] ?? 0))
  return candidates
    .map((p) => {
      const rate = p.rates?.[category] ?? 0
      const pending = state.lots
        .filter((l) => l.facilityId === p.id && l.status !== 'processed')
        .reduce((a, l) => a + (l.receivedKg ?? l.dispatchedKg), 0)
      const headroom = Math.max(0, 1 - pending / p.capacity)
      const proximity = 1 - Math.min(wardDistance(p.baseWard, fromWard) / 3, 1)
      const price = rate / maxRate
      const score = Math.round(100 * (0.4 * proximity + 0.3 * price + 0.3 * headroom))
      return { partner: p, score, parts: { proximity, price, headroom }, eligible: p.status === 'verified', rate }
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score)
}
