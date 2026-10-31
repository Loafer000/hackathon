import { CATEGORIES, FACTORS, WARDS } from './data'
import { HOUR } from './format'
import { lineOutcome } from './store'
import type { AppState, CategoryId, Lot, RejectRoute, Segregation, WasteRequest } from './types'

export interface CatRow {
  est: number
  collected: number
  received: number
  recovered: number
  treated: number
  rejected: number
}

const emptyRow = (): CatRow => ({ est: 0, collected: 0, received: 0, recovered: 0, treated: 0, rejected: 0 })

/**
 * Counting rules (also shown in the UI):
 *  - Estimated kg come from reports and are never added to measured totals.
 *  - Collected kg = collector scale weight, counted once per line.
 *  - Recovered / rejected / treated kg come only from facility records on processed lots.
 *  - A line can belong to one lot only; a processed lot is locked.
 */
export function computeMetrics(state: AppState, since = 0) {
  const reqs = state.requests.filter((r) => r.createdAt >= since)
  const lots = state.lots.filter((l) => l.createdAt >= since)

  const byCat = Object.fromEntries(CATEGORIES.map((c) => [c.id, emptyRow()])) as Record<CategoryId, CatRow>
  const seg: Record<Segregation, number> = { good: 0, partial: 0, poor: 0 }
  const byWard = Object.fromEntries(
    WARDS.map((w) => [
      w.id,
      { requests: 0, good: 0, partial: 0, poor: 0, collected: 0, openDumping: 0, burning: 0 },
    ]),
  )
  const helper = { photo: 0, photoKept: 0, search: 0, searchKept: 0 }

  let est = 0
  let collected = 0
  let pipeline = 0
  let assignTotal = 0
  let assignHours = 0
  let assignedFast = 0
  let collectedCount = 0
  let onTime = 0
  const status = { open: 0, assigned: 0, collected: 0, delivered: 0, closed: 0, cancelled: 0 }

  for (const r of reqs) {
    status[r.status]++
    const w = byWard[r.ward]
    if (w) w.requests++
    if (r.kind === 'dumping' && (r.status === 'open' || r.status === 'assigned') && w) {
      w.openDumping++
      if (r.burning) w.burning++
    }
    if (r.status !== 'cancelled') est += r.estKg
    for (const i of r.items) {
      if (r.kind === 'pickup' && r.status !== 'cancelled') byCat[i.category].est += i.estKg
      if (i.helper) {
        const kept = i.helper.suggested === i.category
        if (i.helper.source === 'photo') {
          helper.photo++
          if (kept) helper.photoKept++
        } else {
          helper.search++
          if (kept) helper.searchKept++
        }
      }
      const kg = i.weighedKg ?? 0
      if (kg > 0) {
        collected += kg
        byCat[i.category].collected += kg
        if (w) w.collected += kg
        if (!lineOutcome(state, i)) pipeline += kg
      }
    }
    if (r.segregation && r.kind === 'pickup') {
      seg[r.segregation]++
      if (w) w[r.segregation]++
    }
    const acc = r.events.find((e) => e.type === 'accepted' || e.type === 'assigned')
    if (acc) {
      assignTotal++
      const h = (acc.at - r.createdAt) / HOUR
      assignHours += h
      if (h <= 24) assignedFast++
    }
    if (r.collectedAt) {
      collectedCount++
      const start = new Date(`${r.slot.date}T00:00:00`).getTime()
      // On time = collected on the scheduled day.
      if (r.collectedAt >= start && r.collectedAt < start + 24 * HOUR) onTime++
    }
  }

  let dispatched = 0
  let received = 0
  let recovered = 0
  let treated = 0
  let rejected = 0
  let loss = 0
  let processedInput = 0
  const routes: Record<RejectRoute, number> = { landfill: 0, coprocessing: 0, returned: 0 }
  const mismatch: Lot[] = []
  let awaitingReceipt = 0
  let awaitingProcess = 0

  for (const l of lots) {
    dispatched += l.dispatchedKg
    if (l.receivedKg !== undefined) {
      received += l.receivedKg
      byCat[l.category].received += l.receivedKg
      if (Math.abs(l.receivedKg - l.dispatchedKg) / l.dispatchedKg > 0.05) mismatch.push(l)
    }
    if (l.status === 'in_transit') awaitingReceipt++
    if (l.status === 'received') awaitingProcess++
    if (l.status === 'processed') {
      const fac = state.partners.find((p) => p.id === l.facilityId)
      if (fac?.mode !== 'disposal') processedInput += l.receivedKg ?? 0
      recovered += l.recoveredKg ?? 0
      treated += l.treatedKg ?? 0
      rejected += l.rejectedKg ?? 0
      loss += l.lossKg ?? 0
      byCat[l.category].recovered += l.recoveredKg ?? 0
      byCat[l.category].treated += l.treatedKg ?? 0
      byCat[l.category].rejected += l.rejectedKg ?? 0
      if (l.rejectRoute) routes[l.rejectRoute] += l.rejectedKg ?? 0
    }
  }

  let co2Mid = 0
  let co2Low = 0
  let co2High = 0
  for (const c of CATEGORIES) {
    const f = FACTORS[c.id]
    if (!f) continue
    const kg = byCat[c.id].recovered
    co2Mid += kg * f.mid
    co2Low += kg * f.low
    co2High += kg * f.high
  }

  const segTotal = seg.good + seg.partial + seg.poor

  return {
    requests: reqs.length,
    pickups: reqs.filter((r) => r.kind === 'pickup').length,
    dumping: reqs.filter((r) => r.kind === 'dumping').length,
    status,
    est,
    collected,
    dispatched,
    received,
    recovered,
    treated,
    rejected,
    loss,
    pipeline,
    processedInput,
    recoveryRate: processedInput ? recovered / processedInput : NaN,
    byCat,
    seg,
    segTotal,
    segGoodShare: segTotal ? seg.good / segTotal : NaN,
    byWard,
    helper,
    coordination: {
      assignTotal,
      assignedFastShare: assignTotal ? assignedFast / assignTotal : NaN,
      avgHoursToAssign: assignTotal ? assignHours / assignTotal : NaN,
      collectedCount,
      onTimeShare: collectedCount ? onTime / collectedCount : NaN,
    },
    quality: { mismatch, awaitingReceipt, awaitingProcess },
    routes,
    impact: { co2Mid, co2Low, co2High },
  }
}

export type Metrics = ReturnType<typeof computeMetrics>

export function requestTotals(state: AppState, r: WasteRequest) {
  let weighed = 0
  let recovered = 0
  let rejected = 0
  let treated = 0
  for (const i of r.items) {
    weighed += i.weighedKg ?? 0
    const o = lineOutcome(state, i)
    if (o) {
      recovered += o.recovered
      rejected += o.rejected
      treated += o.treated
    }
  }
  return { weighed, recovered, rejected, treated }
}

export function toCsv(state: AppState): string {
  const rows: string[][] = [
    ['request_id', 'kind', 'created', 'ward', 'status', 'category', 'est_kg', 'weighed_kg', 'lot_id', 'facility', 'lot_status', 'recovered_kg_share', 'rejected_kg_share', 'treated_kg_share'],
  ]
  for (const r of state.requests) {
    for (const i of r.items) {
      const l = i.lotId ? state.lots.find((x) => x.id === i.lotId) : undefined
      const o = lineOutcome(state, i)
      rows.push([
        r.id,
        r.kind,
        new Date(r.createdAt).toISOString(),
        r.ward,
        r.status,
        i.category,
        String(i.estKg),
        String(i.weighedKg ?? ''),
        i.lotId ?? '',
        l ? (state.partners.find((p) => p.id === l.facilityId)?.name ?? '') : '',
        l?.status ?? '',
        o ? o.recovered.toFixed(2) : '',
        o ? o.rejected.toFixed(2) : '',
        o ? o.treated.toFixed(2) : '',
      ])
    }
  }
  return rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n')
}
