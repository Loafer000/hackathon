import { useSyncExternalStore } from 'react'
import { HEAP_KG, PARTNERS, SLOT_LABEL, SLOT_START_HOUR, SLOT_WINDOWS, UNIT_KG } from './data'
import { DAY, HOUR, addDays, fmtDay, isoDate, parseIso, round1, todayIso } from './format'
import { rankCollectors, rankFacilities } from './match'
import type {
  AppState,
  CategoryId,
  EventType,
  GeneratorType,
  HeapSize,
  HelperTrace,
  Lang,
  Lot,
  RejectRoute,
  RequestKind,
  Reporter,
  Segregation,
  Session,
  Slot,
  TraceEvent,
  UnitId,
  VerifyStatus,
  WasteRequest,
} from './types'

const KEY = 'avartan:v1'
const VERSION = 5

/* ------------------------------------------------------------------ */
/* SMS templates (sent in the reporter's chosen language)              */
/* ------------------------------------------------------------------ */

const SMS = {
  created: {
    en: 'Avartan: request {id} received. We will SMS you when a collector confirms.',
    hi: 'वेस्ट टू वर्थ: अनुरोध {id} मिल गया। कलेक्टर की पुष्टि होने पर SMS आएगा।',
    mr: 'वेस्ट टू वर्थ: विनंती {id} मिळाली. कलेक्टर निश्चित झाल्यावर SMS येईल.',
    bn: 'ওয়েস্ট টু ওয়ার্থ: অনুরোধ {id} পাওয়া গেছে। সংগ্রাহক নিশ্চিত করলে SMS পাবেন।',
  },
  confirmed: {
    en: 'Avartan: pickup {id} confirmed for {day}, {slot}. Collector {name}, {phone}.',
    hi: 'वेस्ट टू वर्थ: पिकअप {id} {day}, {slot} के लिए तय। कलेक्टर {name}, {phone}।',
    mr: 'वेस्ट टू वर्थ: पिकअप {id} {day}, {slot} साठी निश्चित. कलेक्टर {name}, {phone}.',
    bn: 'ওয়েস্ট টু ওয়ার্থ: পিকআপ {id} {day}, {slot}-এ নিশ্চিত। সংগ্রাহক {name}, {phone}।',
  },
  rescheduled: {
    en: 'Avartan: pickup {id} moved to {day}, {slot}.',
    hi: 'वेस्ट टू वर्थ: पिकअप {id} अब {day}, {slot} को।',
    mr: 'वेस्ट टू वर्थ: पिकअप {id} आता {day}, {slot} ला.',
    bn: 'ওয়েস্ট টু ওয়ার্থ: পিকআপ {id} সরানো হয়েছে {day}, {slot}-এ।',
  },
  collected: {
    en: 'Avartan: {kg} kg collected for {id}. Sorting rated: {seg}. Thank you.',
    hi: 'वेस्ट टू वर्थ: {id} से {kg} किलो उठाया गया। छँटाई: {seg}। धन्यवाद।',
    mr: 'वेस्ट टू वर्थ: {id} मधून {kg} किलो उचलले. वर्गीकरण: {seg}. धन्यवाद.',
    bn: 'ওয়েস্ট टू ওয়ার্থ: {id} থেকে {kg} কেজি সংগ্রহ হয়েছে। বাছাই: {seg}। ধন্যবাদ।',
  },
  closed: {
    en: 'Avartan: material from {id} is processed. {kg} kg recovered. Thank you for sorting.',
    hi: 'वेस्ट टू वर्थ: {id} की सामग्री प्रोसेस हुई। {kg} किलो दोबारा उपयोग में। धन्यवाद।',
    mr: 'वेस्ट टू वर्थ: {id} चे साहित्य प्रक्रिया झाले. {kg} किलो पुनर्प्राप्त. धन्यवाद.',
    bn: 'ওয়েস্ট टू ওয়ার্থ: {id}-এর বর্জ্য প্রক্রিয়া হয়েছে। {kg} কেজি পুনরুদ্ধার। ধন্যবাদ।',
  },
}

const SEG_WORD: Record<Segregation, Record<Lang, string>> = {
  good: { en: 'well sorted', hi: 'अच्छी', mr: 'उत्तम', bn: 'ভালো' },
  partial: { en: 'partly sorted', hi: 'आंशिक', mr: 'काही प्रमाणात', bn: 'আংশিক' },
  poor: { en: 'mixed', hi: 'मिला-जुला', mr: 'मिश्रित', bn: 'মিশ্র' },
}

function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function evId(d: AppState) {
  d.seq.x += 1
  return `e${d.seq.x}`
}

function lineId(d: AppState) {
  d.seq.x += 1
  return `i${d.seq.x}`
}

function pushEvent(d: AppState, target: { events: TraceEvent[] }, e: Omit<TraceEvent, 'id'>) {
  target.events.push({ id: evId(d), ...e })
}

export function partnerName(d: AppState, id?: string): string {
  if (!id) return '—'
  return d.partners.find((p) => p.id === id)?.name ?? id
}

export function slotTimestamp(slot: Slot): number {
  return parseIso(slot.date).getTime() + SLOT_START_HOUR[slot.window] * HOUR
}

export function estimateKg(items: { category: CategoryId; qty: number; unit: UnitId }[]): number {
  return round1(items.reduce((a, i) => a + i.qty * UNIT_KG[i.category][i.unit], 0))
}

function req(d: AppState, id: string): WasteRequest {
  const r = d.requests.find((x) => x.id === id)
  if (!r) throw new Error(`Unknown request ${id}`)
  return r
}

function lot(d: AppState, id: string): Lot {
  const l = d.lots.find((x) => x.id === id)
  if (!l) throw new Error(`Unknown lot ${id}`)
  return l
}

/* ------------------------------------------------------------------ */
/* Core transitions (pure functions over a draft)                      */
/* ------------------------------------------------------------------ */

export interface NewItem {
  category: CategoryId
  qty: number
  unit: UnitId
  helper?: HelperTrace
}

export interface NewRequestInput {
  kind: RequestKind
  lang: Lang
  reporter: Reporter
  ward: string
  address: string
  landmark?: string
  geo?: { lat: number; lng: number }
  items: NewItem[]
  heap?: HeapSize
  burning?: boolean
  photo?: string
  note?: string
  slot: Slot
}

function tCreate(d: AppState, input: NewRequestInput, now: number): WasteRequest {
  d.seq.r += 1
  const id = `R-${1000 + d.seq.r}`
  const items = input.items.map((i) => ({
    id: lineId(d),
    category: i.category,
    qty: i.qty,
    unit: i.unit,
    estKg: input.kind === 'pickup' ? round1(i.qty * UNIT_KG[i.category][i.unit]) : 0,
    helper: i.helper,
  }))
  const estKg = input.kind === 'pickup' ? round1(items.reduce((a, i) => a + i.estKg, 0)) : HEAP_KG[input.heap ?? 'small']
  const r: WasteRequest = {
    id,
    kind: input.kind,
    createdAt: now,
    lang: input.lang,
    reporter: input.reporter,
    ward: input.ward,
    address: input.address,
    landmark: input.landmark,
    geo: input.geo,
    items,
    heap: input.heap,
    burning: input.burning,
    estKg,
    photo: input.photo,
    note: input.note,
    slot: input.slot,
    status: 'open',
    declined: [],
    events: [],
  }
  pushEvent(d, r, {
    at: now,
    type: 'created',
    actor: input.reporter.name || 'Anonymous',
    kg: estKg,
    sms: input.reporter.phone ? fill(SMS.created[input.lang], { id }) : undefined,
  })
  d.requests.unshift(r)
  tOfferNext(d, r, now)
  return r
}

function tOfferNext(d: AppState, r: WasteRequest, now: number) {
  const top = rankCollectors(d, r).find((m) => m.eligible)
  if (top) {
    r.offeredTo = top.partner.id
    pushEvent(d, r, { at: now, type: 'offered', actor: 'System', ref: top.partner.id, detail: String(top.score) })
  } else {
    r.offeredTo = undefined
    pushEvent(d, r, { at: now, type: 'unmatched', actor: 'System' })
  }
}

function tAccept(d: AppState, id: string, collectorId: string, now: number, by: 'collector' | 'admin') {
  const r = req(d, id)
  if (r.status !== 'open') return
  const p = d.partners.find((x) => x.id === collectorId)
  r.status = 'assigned'
  r.collectorId = collectorId
  r.offeredTo = undefined
  const type: EventType = by === 'admin' ? 'assigned' : 'accepted'
  pushEvent(d, r, {
    at: now,
    type,
    actor: by === 'admin' ? 'Ward office' : (p?.name ?? collectorId),
    ref: collectorId,
    sms: r.reporter.phone
      ? fill(SMS.confirmed[r.lang], {
          id: r.id,
          day: fmtDay(r.slot.date, r.lang),
          slot: SLOT_LABEL[r.slot.window],
          name: p?.name ?? '',
          phone: p?.phone ?? '',
        })
      : undefined,
  })
}

function tDecline(d: AppState, id: string, collectorId: string, reason: string, now: number) {
  const r = req(d, id)
  if (r.status !== 'open') return
  if (!r.declined.includes(collectorId)) r.declined.push(collectorId)
  r.offeredTo = undefined
  pushEvent(d, r, { at: now, type: 'declined', actor: partnerName(d, collectorId), ref: collectorId, detail: reason })
  tOfferNext(d, r, now)
}

function tReschedule(d: AppState, id: string, slot: Slot, actor: string, now: number) {
  const r = req(d, id)
  if (r.status !== 'open' && r.status !== 'assigned') return
  r.slot = slot
  pushEvent(d, r, {
    at: now,
    type: 'rescheduled',
    actor,
    detail: `${slot.date} ${slot.window}`,
    sms: r.reporter.phone
      ? fill(SMS.rescheduled[r.lang], { id: r.id, day: fmtDay(slot.date, r.lang), slot: SLOT_LABEL[slot.window] })
      : undefined,
  })
}

function tCancel(d: AppState, id: string, actor: string, reason: string, now: number) {
  const r = req(d, id)
  if (r.status !== 'open' && r.status !== 'assigned') return
  r.status = 'cancelled'
  r.offeredTo = undefined
  pushEvent(d, r, { at: now, type: 'cancelled', actor, detail: reason })
}

export interface CollectionEntry {
  lineId?: string
  category: CategoryId
  kg: number
}

function tCollect(
  d: AppState,
  id: string,
  collectorId: string,
  entries: CollectionEntry[],
  segregation: Segregation,
  now: number,
) {
  const r = req(d, id)
  if (r.status !== 'assigned' || r.collectorId !== collectorId) return
  for (const e of entries) {
    const kg = round1(Math.max(0, e.kg))
    if (e.lineId) {
      const line = r.items.find((i) => i.id === e.lineId)
      if (line) {
        line.weighedKg = kg
        line.category = e.category
      }
    } else if (kg > 0) {
      r.items.push({
        id: lineId(d),
        category: e.category,
        qty: kg,
        unit: 'kg',
        estKg: 0,
        weighedKg: kg,
        addedByCollector: true,
      })
    }
  }
  for (const line of r.items) if (line.weighedKg === undefined) line.weighedKg = 0
  const total = round1(r.items.reduce((a, i) => a + (i.weighedKg ?? 0), 0))
  r.status = 'collected'
  r.segregation = segregation
  r.collectedAt = now
  pushEvent(d, r, {
    at: now,
    type: 'collected',
    actor: partnerName(d, collectorId),
    ref: collectorId,
    kg: total,
    detail: segregation,
    sms: r.reporter.phone
      ? fill(SMS.collected[r.lang], { id: r.id, kg: total, seg: SEG_WORD[segregation][r.lang] })
      : undefined,
  })
  tSync(d, r, now)
}

/** Share of a lot's outcome attributable to one line, apportioned by weight contributed. */
export function lineOutcome(d: Pick<AppState, 'lots'>, line: { weighedKg?: number; lotId?: string }) {
  const l = line.lotId ? d.lots.find((x) => x.id === line.lotId) : undefined
  if (!l || l.status !== 'processed' || !line.weighedKg || !l.dispatchedKg) return null
  const share = line.weighedKg / l.dispatchedKg
  return {
    lot: l,
    recovered: share * (l.recoveredKg ?? 0),
    treated: share * (l.treatedKg ?? 0),
    rejected: share * (l.rejectedKg ?? 0),
    loss: share * (l.lossKg ?? 0) + share * (l.dispatchedKg - (l.receivedKg ?? l.dispatchedKg)),
  }
}

function tSync(d: AppState, r: WasteRequest, now: number) {
  if (!r.collectedAt || r.status === 'cancelled') return
  const lines = r.items.filter((i) => (i.weighedKg ?? 0) > 0)
  const prev = r.status
  if (lines.length === 0) {
    r.status = 'closed'
  } else if (!lines.every((i) => i.lotId)) {
    r.status = 'collected'
  } else {
    const done = lines.every((i) => d.lots.find((l) => l.id === i.lotId)?.status === 'processed')
    r.status = done ? 'closed' : 'delivered'
  }
  if (r.status === 'closed' && prev !== 'closed') {
    const recovered = round1(lines.reduce((a, i) => a + (lineOutcome(d, i)?.recovered ?? 0), 0))
    pushEvent(d, r, {
      at: now,
      type: 'closed',
      actor: 'System',
      kg: recovered,
      sms: r.reporter.phone ? fill(SMS.closed[r.lang], { id: r.id, kg: recovered }) : undefined,
    })
  }
}

function tDispatch(
  d: AppState,
  collectorId: string,
  facilityId: string,
  category: CategoryId,
  refs: { requestId: string; lineId: string }[],
  now: number,
): Lot | null {
  const valid: Lot['refs'] = []
  for (const ref of refs) {
    const r = d.requests.find((x) => x.id === ref.requestId)
    const line = r?.items.find((i) => i.id === ref.lineId)
    // A line can be dispatched once only; this is the main double-counting guard.
    if (!r || !line || line.lotId || !line.weighedKg || line.category !== category || r.collectorId !== collectorId) continue
    valid.push({ requestId: r.id, lineId: line.id, kg: line.weighedKg })
  }
  if (!valid.length) return null
  d.seq.l += 1
  const l: Lot = {
    id: `L-${200 + d.seq.l}`,
    createdAt: now,
    collectorId,
    facilityId,
    category,
    refs: valid,
    dispatchedKg: round1(valid.reduce((a, v) => a + v.kg, 0)),
    status: 'in_transit',
    events: [],
  }
  pushEvent(d, l, { at: now, type: 'dispatched', actor: partnerName(d, collectorId), kg: l.dispatchedKg, ref: facilityId })
  d.lots.unshift(l)
  for (const v of valid) {
    const r = req(d, v.requestId)
    const line = r.items.find((i) => i.id === v.lineId)
    if (line) line.lotId = l.id
    tSync(d, r, now)
  }
  return l
}

function tReceive(d: AppState, lotId: string, kg: number, now: number) {
  const l = lot(d, lotId)
  if (l.status !== 'in_transit') return
  l.status = 'received'
  l.receivedKg = round1(kg)
  l.receivedAt = now
  pushEvent(d, l, { at: now, type: 'received', actor: partnerName(d, l.facilityId), kg: l.receivedKg })
}

export interface Outcome {
  primaryKg: number
  rejectedKg: number
  rejectRoute?: RejectRoute
  output?: string
}

function tProcess(d: AppState, lotId: string, o: Outcome, now: number) {
  const l = lot(d, lotId)
  if (l.status !== 'received' || l.receivedKg === undefined) return
  const fac = d.partners.find((p) => p.id === l.facilityId)
  const primary = round1(Math.max(0, o.primaryKg))
  const rejected = round1(Math.max(0, o.rejectedKg))
  if (primary + rejected > l.receivedKg + 0.05) return
  if (fac?.mode === 'disposal') {
    l.treatedKg = primary
    l.recoveredKg = 0
  } else {
    l.recoveredKg = primary
    l.treatedKg = 0
  }
  l.rejectedKg = rejected
  l.lossKg = round1(Math.max(0, l.receivedKg - primary - rejected))
  l.rejectRoute = rejected > 0 ? (o.rejectRoute ?? 'landfill') : undefined
  l.output = o.output
  l.processedAt = now
  l.status = 'processed'
  pushEvent(d, l, { at: now, type: 'processed', actor: fac?.name ?? l.facilityId, kg: primary, detail: o.output })
  const ids = new Set(l.refs.map((r) => r.requestId))
  for (const id of ids) tSync(d, req(d, id), now)
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

function defaultSession(): Session {
  return {
    onboarded: false,
    role: 'generator',
    lang: 'en',
    userName: 'Meera Joshi',
    userPhone: '98220 41736',
    userWard: 'w2',
    userType: 'household',
    userAddress: 'Flat 4, Sai Krupa Apartments, Station Road',
    collectorId: 'c1',
    facilityId: 'f1',
    lite: false,
    largeText: false,
  }
}

let state: AppState
const listeners = new Set<() => void>()
let persistFailed = false

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && parsed.version === VERSION && Array.isArray(parsed.requests)) return parsed
    }
  } catch {
    /* fall through to seed */
  }
  return buildSeed(defaultSession())
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    persistFailed = false
  } catch {
    // Storage full (photos are the usual cause): drop photos from older reports and retry once.
    try {
      const slim: AppState = {
        ...state,
        requests: state.requests.map((r, i) => (i < 3 ? r : { ...r, photo: undefined })),
      }
      localStorage.setItem(KEY, JSON.stringify(slim))
      persistFailed = false
    } catch {
      persistFailed = true
    }
  }
}

export function storageProblem() {
  return persistFailed
}

function commit(fn: (d: AppState) => void) {
  const draft = structuredClone(state)
  fn(draft)
  state = draft
  save()
  listeners.forEach((l) => l())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() {
  return state
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return
    try {
      state = JSON.parse(e.newValue) as AppState
      listeners.forEach((l) => l())
    } catch {
      /* ignore */
    }
  })
}

/* Public actions */

export const actions = {
  createRequest(input: NewRequestInput): string {
    let id = ''
    commit((d) => {
      id = tCreate(d, input, Date.now()).id
    })
    return id
  },
  accept(id: string, collectorId: string) {
    commit((d) => tAccept(d, id, collectorId, Date.now(), 'collector'))
  },
  assign(id: string, collectorId: string) {
    commit((d) => tAccept(d, id, collectorId, Date.now(), 'admin'))
  },
  decline(id: string, collectorId: string, reason: string) {
    commit((d) => tDecline(d, id, collectorId, reason, Date.now()))
  },
  reschedule(id: string, slot: Slot, actor: string) {
    commit((d) => tReschedule(d, id, slot, actor, Date.now()))
  },
  cancel(id: string, actor: string, reason: string) {
    commit((d) => tCancel(d, id, actor, reason, Date.now()))
  },
  collect(id: string, collectorId: string, entries: CollectionEntry[], segregation: Segregation) {
    commit((d) => tCollect(d, id, collectorId, entries, segregation, Date.now()))
  },
  dispatch(collectorId: string, facilityId: string, category: CategoryId, refs: { requestId: string; lineId: string }[]) {
    let id: string | null = null
    commit((d) => {
      id = tDispatch(d, collectorId, facilityId, category, refs, Date.now())?.id ?? null
    })
    return id
  },
  receive(lotId: string, kg: number) {
    commit((d) => tReceive(d, lotId, kg, Date.now()))
  },
  process(lotId: string, o: Outcome) {
    commit((d) => tProcess(d, lotId, o, Date.now()))
  },
  setPartnerStatus(id: string, status: VerifyStatus) {
    commit((d) => {
      const p = d.partners.find((x) => x.id === id)
      if (p) p.status = status
    })
  },
  updateSession(patch: Partial<Session>) {
    commit((d) => {
      d.session = { ...d.session, ...patch }
    })
  },
  resetDemo() {
    const keep = state.session
    state = buildSeed({ ...defaultSession(), onboarded: keep.onboarded, lang: keep.lang, role: keep.role, lite: keep.lite, largeText: keep.largeText })
    save()
    listeners.forEach((l) => l())
  },
}

/* ------------------------------------------------------------------ */
/* Seed: built by replaying real transitions so every figure is        */
/* internally consistent (same rules as live use).                     */
/* ------------------------------------------------------------------ */

interface Person extends Reporter {
  ward: string
  address: string
  lang: Lang
}

const PEOPLE: Person[] = [
  { name: 'Meera Joshi', phone: '98220 41736', type: 'household', ward: 'w2', address: 'Flat 4, Sai Krupa Apartments, Station Road', lang: 'en' },
  { name: 'Annapurna Hotel', phone: '98901 22450', type: 'business', ward: 'w1', address: 'Main Bazaar, near clock tower', lang: 'en' },
  { name: 'Farhan Qureshi', phone: '97654 10982', type: 'household', ward: 'w4', address: 'Line 3, Mill Colony', lang: 'hi' },
  { name: 'Zilla Parishad School', phone: '94220 66108', type: 'institution', ward: 'w3', address: 'Riverside Road', lang: 'hi' },
  { name: 'Sunita Gaikwad', phone: '99701 55432', type: 'household', ward: 'w5', address: 'Plot 18, Shanti Nagar', lang: 'hi' },
  { name: 'Kheda Kirana Store', phone: '90110 77821', type: 'business', ward: 'w6', address: 'Main chowk, Kheda', lang: 'hi' },
  { name: 'Ramesh Tiwari', phone: '98500 31267', type: 'household', ward: 'w7', address: 'Near Hanuman temple, Sonpur', lang: 'hi' },
  { name: 'Hotel Green Leaf', phone: '98230 90071', type: 'business', ward: 'w5', address: 'Highway road, Shanti Nagar', lang: 'en' },
]

const BASKETS: Record<GeneratorType, NewItem[][]> = {
  household: [
    [{ category: 'organic', qty: 1, unit: 'bucket' }, { category: 'plastic', qty: 2, unit: 'smallbag' }],
    [{ category: 'plastic', qty: 3, unit: 'smallbag' }, { category: 'paper', qty: 1, unit: 'sack' }],
    [{ category: 'paper', qty: 2, unit: 'smallbag' }, { category: 'metal', qty: 1, unit: 'smallbag' }, { category: 'glass', qty: 6, unit: 'items' }],
    [{ category: 'organic', qty: 2, unit: 'bucket' }, { category: 'sanitary', qty: 1, unit: 'smallbag' }],
    [{ category: 'ewaste', qty: 3, unit: 'items' }, { category: 'hazardous', qty: 6, unit: 'items' }],
  ],
  business: [
    [{ category: 'organic', qty: 4, unit: 'bucket' }, { category: 'plastic', qty: 1, unit: 'sack' }],
    [{ category: 'paper', qty: 2, unit: 'sack' }, { category: 'plastic', qty: 1, unit: 'sack' }],
    [{ category: 'glass', qty: 24, unit: 'items' }, { category: 'metal', qty: 1, unit: 'sack' }, { category: 'organic', qty: 3, unit: 'bucket' }],
  ],
  institution: [
    [{ category: 'paper', qty: 3, unit: 'sack' }, { category: 'plastic', qty: 1, unit: 'sack' }],
    [{ category: 'organic', qty: 3, unit: 'bucket' }, { category: 'paper', qty: 1, unit: 'sack' }],
  ],
}

const RECOVERY: Record<CategoryId, number> = {
  organic: 0.9,
  plastic: 0.74,
  paper: 0.88,
  metal: 0.95,
  glass: 0.86,
  ewaste: 0.8,
  hazardous: 0.97,
  sanitary: 0.97,
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function forceOffer(d: AppState, r: WasteRequest, cid: string) {
  r.offeredTo = cid
  const last = [...r.events].reverse().find((e) => e.type === 'offered' || e.type === 'unmatched')
  if (last) {
    last.type = 'offered'
    last.ref = cid
  }
}

function personInput(p: Person, items: NewItem[], slot: Slot, extra: Partial<NewRequestInput> = {}): NewRequestInput {
  return {
    kind: 'pickup',
    lang: p.lang,
    reporter: { name: p.name, phone: p.phone, type: p.type },
    ward: p.ward,
    address: p.address,
    items,
    slot,
    ...extra,
  }
}

function buildSeed(session: Session): AppState {
  const now = Date.now()
  const today = todayIso()
  const rand = mulberry32(20251101)
  const d: AppState = {
    version: VERSION,
    seq: { r: 0, l: 0, x: 0 },
    requests: [],
    lots: [],
    partners: structuredClone(PARTNERS),
    session,
  }

  const weigh = (est: number) => round1(Math.max(0.2, est * (0.72 + rand() * 0.56)))
  const segPick = (): Segregation => {
    const x = rand()
    return x < 0.56 ? 'good' : x < 0.85 ? 'partial' : 'poor'
  }

  /* Historic activity spanning across 120 days to ensure 7d, 30d, and all-time give distinct metrics */
  const N = 64
  for (let i = 0; i < N; i++) {
    // Distribute: first 22 items between 32 and 115 days ago, next 28 items between 8 and 30 days ago, last 14 items in last 7 days
    let dayAgo: number
    if (i < 22) {
      dayAgo = Math.round(115 - (i / 22) * 80) // 115 down to 35 days ago (older than 30d)
    } else if (i < 50) {
      dayAgo = Math.round(30 - ((i - 22) / 28) * 22) // 30 down to 8 days ago
    } else {
      dayAgo = Math.round(7 - ((i - 50) / 14) * 6) // 7 down to 1 day ago
    }
    const created = startOfDay(now - dayAgo * DAY) + (7 + rand() * 11) * HOUR
    const slot: Slot = { date: isoDate(new Date(created + DAY)), window: SLOT_WINDOWS[i % 3] }
    const isDump = i % 9 === 5
    let input: NewRequestInput
    if (isDump) {
      const ward = ['w6', 'w7', 'w3', 'w6'][i % 4]
      input = {
        kind: 'dumping',
        lang: 'hi',
        reporter: { name: 'Resident', phone: '', type: 'household' },
        ward,
        address: ward === 'w3' ? 'Riverbank behind bus depot' : 'Field edge on the approach road',
        items: [
          { category: 'plastic', qty: 1, unit: 'kg' },
          { category: 'organic', qty: 1, unit: 'kg' },
          { category: 'paper', qty: 1, unit: 'kg' },
        ],
        heap: i % 2 ? 'small' : 'medium',
        slot,
      }
    } else {
      const p = PEOPLE[(i * 3) % PEOPLE.length]
      const basket = structuredClone(BASKETS[p.type][Math.floor(rand() * BASKETS[p.type].length)])
      if (i % 4 === 0) basket[0].helper = { source: 'search', suggested: basket[0].category }
      if (i % 6 === 1) {
        basket[0].helper = {
          source: 'photo',
          suggested: basket[0].category === 'plastic' ? 'paper' : 'plastic',
          confidence: 0.38,
        }
      } else if (i % 6 === 3) {
        basket[0].helper = { source: 'photo', suggested: basket[0].category, confidence: 0.47 }
      }
      input = personInput(p, basket, slot)
    }
    const r = tCreate(d, input, created)
    if (i % 13 === 7) {
      tCancel(d, r.id, r.reporter.name, 'No longer needed', created + 2 * HOUR)
      continue
    }
    if (r.offeredTo && i % 7 === 3) tDecline(d, r.id, r.offeredTo, 'Route full that day', created + HOUR)
    const cid = r.offeredTo
    if (!cid) continue
    tAccept(d, r.id, cid, created + (1 + rand() * 6) * HOUR, 'collector')
    const collectAt = slotTimestamp(slot) + rand() * 1.6 * HOUR
    let entries: CollectionEntry[]
    if (isDump) {
      const total = r.estKg * (0.6 + rand() * 0.6)
      const mix: [CategoryId, number][] = [
        ['plastic', 0.34],
        ['organic', 0.4],
        ['paper', 0.12],
        ['glass', 0.06],
      ]
      const p = d.partners.find((x) => x.id === cid)!
      entries = r.items.map((line) => ({ lineId: line.id, category: line.category, kg: 0 }))
      for (const [cat, share] of mix) {
        if (!p.categories.includes(cat)) continue
        const existing = entries.find((e) => e.category === cat)
        if (existing) existing.kg = round1(total * share)
        else entries.push({ category: cat, kg: round1(total * share) })
      }
    } else {
      entries = r.items.map((line) => ({ lineId: line.id, category: line.category, kg: weigh(line.estKg) }))
    }
    tCollect(d, r.id, cid, entries, isDump ? 'poor' : segPick(), collectAt)
  }

  /* Historic lots: group by collector + category + week */
  const groups = new Map<string, { cid: string; cat: CategoryId; refs: { requestId: string; lineId: string }[]; last: number }>()
  for (const r of d.requests) {
    if (!r.collectedAt || !r.collectorId) continue
    for (const line of r.items) {
      if (!line.weighedKg || line.lotId) continue
      const week = Math.floor((now - r.collectedAt) / (7 * DAY))
      const key = `${r.collectorId}|${line.category}|${week}`
      const g = groups.get(key) ?? { cid: r.collectorId, cat: line.category, refs: [], last: 0 }
      g.refs.push({ requestId: r.id, lineId: line.id })
      g.last = Math.max(g.last, r.collectedAt)
      groups.set(key, g)
    }
  }
  let lotCount = 0
  for (const g of [...groups.values()].sort((a, b) => a.last - b.last)) {
    const dispatchAt = g.last + (14 + rand() * 10) * HOUR
    if (dispatchAt > now - 2 * DAY) continue
    const base = d.partners.find((p) => p.id === g.cid)!.baseWard
    const fac = rankFacilities(d, g.cat, base).find((f) => f.eligible)
    if (!fac) continue
    const l = tDispatch(d, g.cid, fac.partner.id, g.cat, g.refs, dispatchAt)
    if (!l) continue
    lotCount++
    const receiveAt = dispatchAt + (2 + rand() * 4) * HOUR
    const ratio = lotCount === 4 ? 0.9 : 0.975 + rand() * 0.035
    tReceive(d, l.id, l.dispatchedKg * ratio, receiveAt)
    const processAt = receiveAt + (16 + rand() * 30) * HOUR
    if (processAt > now - 12 * HOUR) continue
    const rec = l.receivedKg! * (RECOVERY[g.cat] - 0.04 + rand() * 0.08)
    const rejected = (l.receivedKg! - rec) * (g.cat === 'organic' ? 0.4 : 0.85)
    tProcess(
      d,
      l.id,
      {
        primaryKg: rec,
        rejectedKg: rejected,
        rejectRoute: g.cat === 'plastic' ? 'coprocessing' : 'landfill',
        output: OUTPUT[g.cat],
      },
      processAt,
    )
  }

  /* Live scenarios for the demo, relative to now */
  const meera = PEOPLE[0]
  const s = (date: string, window: Slot['window']): Slot => ({ date, window })
  const tomorrow = addDays(today, 1)

  // Collector c1 has work at every stage.
  const prakash: Person = { name: 'Prakash Medical Store', phone: '98224 55310', type: 'business', ward: 'w2', address: 'Shop 7, Station Road', lang: 'en' }
  const deepa: Person = { name: 'Deepa Kulkarni', phone: '99223 10457', type: 'household', ward: 'w2', address: 'B-12, Railway Colony', lang: 'en' }
  const joshi: Person = { name: 'Joshi Sweets', phone: '98810 22093', type: 'business', ward: 'w1', address: 'Gandhi Chowk, Old Market', lang: 'hi' }
  const kavita: Person = { name: 'Kavita More', phone: '97660 48120', type: 'household', ward: 'w4', address: 'Room 21, Chawl 5, Mill Colony', lang: 'hi' }

  // Processed-in-transit chain for Joshi Sweets
  const js = tCreate(d, personInput(joshi, [{ category: 'plastic', qty: 1, unit: 'sack' }, { category: 'paper', qty: 2, unit: 'sack' }], s(addDays(today, -3), '09-11')), now - 4 * DAY)
  tAccept(d, js.id, 'c1', now - 4 * DAY + 2 * HOUR, 'collector')
  tCollect(d, js.id, 'c1', js.items.map((l) => ({ lineId: l.id, category: l.category, kg: weigh(l.estKg) })), 'good', now - 3 * DAY + 2 * HOUR)

  const pk = tCreate(d, personInput(prakash, [{ category: 'paper', qty: 2, unit: 'sack' }, { category: 'plastic', qty: 1, unit: 'sack' }], s(addDays(today, -1), '17-19')), now - 2 * DAY)
  tAccept(d, pk.id, 'c1', now - 2 * DAY + HOUR, 'collector')
  tCollect(d, pk.id, 'c1', pk.items.map((l) => ({ lineId: l.id, category: l.category, kg: weigh(l.estKg) })), 'partial', now - 20 * HOUR)

  const dk = tCreate(d, personInput(deepa, [{ category: 'plastic', qty: 4, unit: 'smallbag' }, { category: 'metal', qty: 30, unit: 'items' }], s(addDays(today, -1), '07-09')), now - 2 * DAY + 3 * HOUR)
  tAccept(d, dk.id, 'c1', now - 2 * DAY + 5 * HOUR, 'collector')
  tCollect(d, dk.id, 'c1', dk.items.map((l) => ({ lineId: l.id, category: l.category, kg: weigh(l.estKg) })), 'good', now - 26 * HOUR)

  const jsPlastic = js.items.filter((l) => l.category === 'plastic').map((l) => ({ requestId: js.id, lineId: l.id }))
  const jsPaper = js.items.filter((l) => l.category === 'paper').map((l) => ({ requestId: js.id, lineId: l.id }))
  tDispatch(d, 'c1', 'f1', 'plastic', jsPlastic, now - 5 * HOUR)
  const paperLot = tDispatch(d, 'c1', 'f3', 'paper', jsPaper, now - 2 * DAY)
  if (paperLot) tReceive(d, paperLot.id, paperLot.dispatchedKg * 0.99, now - 2 * DAY + 3 * HOUR)

  // School via c2: received at Shakti Polymers and compost yard, waiting to be processed
  const school = PEOPLE[3]
  const zp = tCreate(d, personInput(school, [{ category: 'plastic', qty: 1, unit: 'sack' }, { category: 'organic', qty: 3, unit: 'bucket' }, { category: 'paper', qty: 1, unit: 'sack' }], s(addDays(today, -3), '07-09')), now - 4 * DAY)
  tAccept(d, zp.id, 'c2', now - 4 * DAY + HOUR, 'collector')
  tCollect(d, zp.id, 'c2', zp.items.map((l) => ({ lineId: l.id, category: l.category, kg: weigh(l.estKg) })), 'good', now - 3 * DAY + HOUR)
  for (const cat of ['plastic', 'organic'] as CategoryId[]) {
    const refs = zp.items.filter((l) => l.category === cat).map((l) => ({ requestId: zp.id, lineId: l.id }))
    const l = tDispatch(d, 'c2', cat === 'plastic' ? 'f1' : 'f2', cat, refs, now - 30 * HOUR)
    if (l) tReceive(d, l.id, l.dispatchedKg * 0.985, now - 26 * HOUR)
  }

  // Scheduled for today with c1
  const an = tCreate(d, personInput(PEOPLE[1], [{ category: 'plastic', qty: 1, unit: 'sack' }, { category: 'glass', qty: 18, unit: 'items' }, { category: 'metal', qty: 1, unit: 'smallbag' }], s(today, '09-11')), now - 22 * HOUR)
  tAccept(d, an.id, 'c1', now - 20 * HOUR, 'collector')
  const fq = tCreate(d, personInput(PEOPLE[2], [{ category: 'plastic', qty: 2, unit: 'smallbag' }, { category: 'paper', qty: 2, unit: 'smallbag' }], s(today, '17-19')), now - 18 * HOUR)
  tAccept(d, fq.id, 'c1', now - 17 * HOUR, 'collector')

  // Offers waiting for c1
  const kv = tCreate(d, personInput(kavita, [{ category: 'paper', qty: 1, unit: 'sack' }, { category: 'metal', qty: 1, unit: 'smallbag' }], s(tomorrow, '09-11')), now - 3 * HOUR)
  forceOffer(d, kv, 'c1')

  // Meera: one confirmed pickup and one fresh request
  const mh = tCreate(d, personInput(meera, [{ category: 'ewaste', qty: 2, unit: 'items' }, { category: 'hazardous', qty: 6, unit: 'items' }], s(addDays(today, 2), '17-19')), now - 26 * HOUR)
  tAccept(d, mh.id, 'c3', now - 25 * HOUR, 'collector')
  const mo = tCreate(
    d,
    personInput(
      meera,
      [
        { category: 'plastic', qty: 3, unit: 'smallbag', helper: { source: 'search', suggested: 'plastic' } },
        { category: 'paper', qty: 1, unit: 'sack' },
      ],
      s(tomorrow, '07-09'),
    ),
    now - 50 * 60 * 1000,
  )
  forceOffer(d, mo, 'c1')

  // Illegal dumping reports
  const sonpur = tCreate(
    d,
    {
      kind: 'dumping',
      lang: 'hi',
      reporter: { name: 'Ramesh Tiwari', phone: '98500 31267', type: 'household' },
      ward: 'w7',
      address: 'Behind the bus stop on the Sonpur approach road',
      landmark: 'Old water tank',
      items: [
        { category: 'plastic', qty: 1, unit: 'kg' },
        { category: 'organic', qty: 1, unit: 'kg' },
        { category: 'sanitary', qty: 1, unit: 'kg' },
      ],
      heap: 'large',
      slot: s(tomorrow, '09-11'),
    },
    now - 40 * HOUR,
  )
  if (sonpur.offeredTo) tDecline(d, sonpur.id, sonpur.offeredTo, 'Needs a tractor, not a handcart', now - 30 * HOUR)

  const kh = tCreate(
    d,
    {
      kind: 'dumping',
      lang: 'hi',
      reporter: { name: 'Kheda Kirana Store', phone: '90110 77821', type: 'business' },
      ward: 'w6',
      address: 'Canal bridge, east side',
      items: [
        { category: 'plastic', qty: 1, unit: 'kg' },
        { category: 'organic', qty: 1, unit: 'kg' },
      ],
      heap: 'medium',
      burning: true,
      slot: s(tomorrow, '07-09'),
    },
    now - 3 * HOUR,
  )
  void kh

  return d
}

const OUTPUT: Record<CategoryId, string> = {
  organic: 'Compost',
  plastic: 'Washed granules',
  paper: 'Baled for paper mill',
  metal: 'Sorted scrap to foundry',
  glass: 'Cullet to glass unit',
  ewaste: 'Dismantled fractions',
  hazardous: 'Secure treatment',
  sanitary: 'Incinerated',
}

export const OUTPUT_DEFAULT = OUTPUT


// Initialise last so every seed constant above is defined.
state = load()
