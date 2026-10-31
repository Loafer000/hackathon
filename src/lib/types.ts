export type Role = 'generator' | 'collector' | 'processor' | 'admin'
export type Lang = 'en' | 'hi' | 'mr' | 'bn'

export type CategoryId =
  | 'organic'
  | 'plastic'
  | 'paper'
  | 'metal'
  | 'glass'
  | 'ewaste'
  | 'hazardous'
  | 'sanitary'

export type Stream = 'wet' | 'dry' | 'special' | 'sanitary'
export type UnitId = 'kg' | 'smallbag' | 'sack' | 'bucket' | 'items'
export type HeapSize = 'small' | 'medium' | 'large'
export type SlotWindow = '07-09' | '09-11' | '17-19'
export type GeneratorType = 'household' | 'business' | 'institution'
export type RequestKind = 'pickup' | 'dumping'
export type RequestStatus = 'open' | 'assigned' | 'collected' | 'delivered' | 'closed' | 'cancelled'
export type Segregation = 'good' | 'partial' | 'poor'
export type LotStatus = 'in_transit' | 'received' | 'processed'
export type RejectRoute = 'landfill' | 'coprocessing' | 'returned'
export type VerifyStatus = 'verified' | 'pending' | 'suspended'
export type FacilityMode = 'recovery' | 'disposal'

export type EventType =
  | 'created'
  | 'offered'
  | 'unmatched'
  | 'declined'
  | 'accepted'
  | 'assigned'
  | 'rescheduled'
  | 'cancelled'
  | 'collected'
  | 'dispatched'
  | 'received'
  | 'processed'
  | 'closed'

export interface HelperTrace {
  source: 'photo' | 'search'
  suggested: CategoryId
  confidence?: number
}

export interface NewItem {
  category: CategoryId
  qty: number
  unit: UnitId
  helper?: HelperTrace
}

export interface CollectionEntry {
  lineId?: string
  category: CategoryId
  kg: number
}

export interface LineItem {
  id: string
  category: CategoryId
  qty: number
  unit: UnitId
  /** Estimate derived from the published unit-weight table at the time of reporting. */
  estKg: number
  helper?: HelperTrace
  /** Weight recorded by the collector on a scale. The only weight that counts as "collected". */
  weighedKg?: number
  lotId?: string
  addedByCollector?: boolean
}

export interface TraceEvent {
  id: string
  at: number
  type: EventType
  actor: string
  kg?: number
  ref?: string
  detail?: string
  sms?: string
}

export interface Slot {
  date: string
  window: SlotWindow
}

export interface Reporter {
  name: string
  phone: string
  type: GeneratorType
}

export interface WasteRequest {
  id: string
  kind: RequestKind
  createdAt: number
  lang: Lang
  reporter: Reporter
  ward: string
  address: string
  landmark?: string
  geo?: { lat: number; lng: number }
  items: LineItem[]
  heap?: HeapSize
  burning?: boolean
  estKg: number
  photo?: string
  note?: string
  slot: Slot
  status: RequestStatus
  collectorId?: string
  offeredTo?: string
  declined: string[]
  segregation?: Segregation
  collectedAt?: number
  events: TraceEvent[]
}

export interface LotRef {
  requestId: string
  lineId: string
  kg: number
}

export interface Lot {
  id: string
  createdAt: number
  collectorId: string
  facilityId: string
  category: CategoryId
  refs: LotRef[]
  dispatchedKg: number
  status: LotStatus
  receivedKg?: number
  receivedAt?: number
  recoveredKg?: number
  treatedKg?: number
  rejectedKg?: number
  lossKg?: number
  rejectRoute?: RejectRoute
  output?: string
  processedAt?: number
  events: TraceEvent[]
}

export interface Partner {
  id: string
  kind: 'collector' | 'facility'
  name: string
  org: string
  phone: string
  baseWard: string
  wards: string[]
  categories: CategoryId[]
  status: VerifyStatus
  credential: string
  /** Collectors: pickups per day. Facilities: kg per day. */
  capacity: number
  mode?: FacilityMode
  method?: string
  rates?: Partial<Record<CategoryId, number>>
}

export interface Session {
  onboarded: boolean
  role: Role
  lang: Lang
  userName: string
  userPhone: string
  userWard: string
  userType: GeneratorType
  userAddress: string
  collectorId: string
  facilityId: string
  lite: boolean
  largeText: boolean
}

export interface AppState {
  version: number
  seq: { r: number; l: number; x: number }
  requests: WasteRequest[]
  lots: Lot[]
  partners: Partner[]
  session: Session
}
