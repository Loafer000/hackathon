import React, { useState } from 'react'
import {
  Truck,
  Scale,
  MapPin,
  Clock3,
  Phone,
  Check,
  X,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT } from '../lib/i18n'
import { CATEGORIES, SLOT_LABEL } from '../lib/data'
import { rankFacilities } from '../lib/match'
import { fmtDay, round1 } from '../lib/format'
import type { WasteRequest, CategoryId, Segregation, CollectionEntry } from '../lib/types'

export function CollectorView() {
  const state = useApp()
  const { session, partners, requests } = useApp()
  const { t, lang } = useT()

  const currentCollector = partners.find((p) => p.id === session.collectorId) || partners[0]

  // Filter requests assigned or offered to this collector
  const myOffers = requests.filter(
    (r) => r.status === 'open' && r.offeredTo === currentCollector.id
  )
  const myAssigned = requests.filter(
    (r) => r.status === 'assigned' && r.collectorId === currentCollector.id
  )
  const myCollected = requests.filter(
    (r) => (r.status === 'collected' || r.status === 'delivered' || r.status === 'closed') && r.collectorId === currentCollector.id
  )

  // Doorstep Weigh-in Modal state
  const [activeWeighReq, setActiveWeighReq] = useState<WasteRequest | null>(null)
  const [weighEntries, setWeighEntries] = useState<CollectionEntry[]>([])
  const [segregationRating, setSegregationRating] = useState<Segregation>('good')
  const [handOffPin, setHandOffPin] = useState('4812')

  // Dispatch to Facility state
  const [dispatchCategory, setDispatchCategory] = useState<CategoryId>('plastic')
  const [dispatching, setDispatching] = useState(false)
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null)

  function openWeighModal(req: WasteRequest) {
    setActiveWeighReq(req)
    // Initialize entries with estimated lines
    const initial: CollectionEntry[] = req.items.map((i) => ({
      lineId: i.id,
      category: i.category,
      kg: i.weighedKg || (i.estKg > 0 ? i.estKg : 5.0),
    }))
    setWeighEntries(initial)
    setSegregationRating('good')
  }

  function handleSaveCollection() {
    if (!activeWeighReq) return
    actions.collect(activeWeighReq.id, currentCollector.id, weighEntries, segregationRating)
    setActiveWeighReq(null)
  }

  function addExtraStreamLine() {
    setWeighEntries([...weighEntries, { category: 'metal', kg: 1.0 }])
  }

  // Find undelivered collected lines belonging to this collector
  const undeliveredLines: { reqId: string; lineId: string; category: CategoryId; kg: number }[] = []
  for (const r of myCollected) {
    for (const item of r.items) {
      if (item.weighedKg && item.weighedKg > 0 && !item.lotId) {
        undeliveredLines.push({
          reqId: r.id,
          lineId: item.id,
          category: item.category,
          kg: item.weighedKg,
        })
      }
    }
  }

  // Group undelivered by category
  const undeliveredByCat: Record<string, number> = {}
  undeliveredLines.forEach((l) => {
    undeliveredByCat[l.category] = (undeliveredByCat[l.category] || 0) + l.kg
  })

  // Filter lines for active dispatch category
  const linesForCategory = undeliveredLines.filter((l) => l.category === dispatchCategory)
  const totalCategoryKg = round1(linesForCategory.reduce((acc, l) => acc + l.kg, 0))

  // Facility matches for this category
  const facilityMatches = rankFacilities(state, dispatchCategory, currentCollector.baseWard)
  const topFacility = facilityMatches.find((f) => f.eligible)

  function handleDispatch() {
    if (!topFacility || linesForCategory.length === 0) return
    setDispatching(true)
    const refs = linesForCategory.map((l) => ({ requestId: l.reqId, lineId: l.lineId }))
    const lotId = actions.dispatch(currentCollector.id, topFacility.partner.id, dispatchCategory, refs)
    setDispatching(false)
    if (lotId) {
      setDispatchSuccess(`Dispatched ${totalCategoryKg} kg to ${topFacility.partner.name} under Manifest ${lotId}`)
      setTimeout(() => setDispatchSuccess(null), 5000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Collector Profile Banner */}
      <div className="rounded-2xl border border-[#d6e2cf] bg-[#f0f6ea] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#183f32] text-[#dff47d] grid place-items-center shadow-xs">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl text-[#183f32]">
                {currentCollector.name}
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#3b6021] bg-[#dbe8cb] px-2 py-0.5 rounded">
                <ShieldCheck size={12} /> {currentCollector.status.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#506659] mt-0.5">
              {currentCollector.org} · Base: {currentCollector.baseWard.toUpperCase()} · Max Route: {currentCollector.capacity} stops/day
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#637a6e]">
              Awaiting Delivery
            </div>
            <div className="text-lg font-extrabold text-[#183f32]">
              {round1(undeliveredLines.reduce((acc, l) => acc + l.kg, 0))} kg
            </div>
          </div>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-[#b8df9c] bg-[#eefae4] text-xs font-extrabold text-[#29561b]">
          <CheckCircle2 size={16} /> {dispatchSuccess}
        </div>
      )}

      {/* Grid: 1. Offers & Route | 2. Dispatch to Recycler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Offers & Route */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incoming Job Offers */}
          {myOffers.length > 0 && (
            <div className="rounded-2xl border border-[#e8d7b0] bg-[#fffaf0] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#8b5a19] flex items-center gap-1.5">
                  <Clock3 size={15} /> New Pickup Offers Waiting for You ({myOffers.length})
                </div>
              </div>

              <div className="space-y-2.5">
                {myOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-3.5 rounded-xl border border-[#eedab2] bg-white flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#183f32]">
                          {offer.id} · {offer.reporter.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#718478]">
                          {fmtDay(offer.slot.date, lang)} ({SLOT_LABEL[offer.slot.window]})
                        </span>
                      </div>
                      <div className="text-xs text-[#52695c] font-medium mt-0.5">
                        {offer.address}, {offer.ward} · Est: ~{offer.estKg} kg (
                        {offer.items.map((i) => i.category).join(', ')})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => actions.decline(offer.id, currentCollector.id, 'Route full')}
                        className="px-3 py-1.5 rounded-lg border border-[#e0c4b4] text-xs font-extrabold text-[#aa3d24] hover:bg-[#fff0eb]"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => actions.accept(offer.id, currentCollector.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#183f32] text-xs font-extrabold text-[#dff47d] hover:bg-[#102d24] shadow-xs"
                      >
                        Accept Stop
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Assigned Stops */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#183f32]">
                  Today's Active Doorstep Stops ({myAssigned.length})
                </h2>
                <p className="text-xs text-[#63796d] font-medium mt-0.5">
                  Arrive with calibrated scale, examine segregation quality, and log true door weights.
                </p>
              </div>
            </div>

            {myAssigned.length === 0 ? (
              <div className="text-xs text-[#718579] text-center py-8 border border-dashed border-[#dce2d7] rounded-xl">
                No active pickups scheduled. Accept an offer above or wait for ward routing.
              </div>
            ) : (
              <div className="space-y-3">
                {myAssigned.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-[#dce3d6] bg-[#fafbf8] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#183f32]">
                            {job.id} · {job.reporter.name}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#3a6828] bg-[#e4eed9] px-2 py-0.5 rounded">
                            {job.kind === 'dumping' ? 'OPEN DUMPING' : 'DOORSTEP PICKUP'}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#546b5d] flex items-center gap-1.5 mt-1">
                          <MapPin size={13} className="text-[#64843b]" />
                          <span>{job.address}, {job.ward}</span>
                        </div>
                        <div className="text-xs text-[#6e8076] font-medium mt-0.5 flex items-center gap-1.5">
                          <Clock3 size={13} />
                          <span>Window: {SLOT_LABEL[job.slot.window]} ({job.slot.date})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {job.reporter.phone && (
                          <a
                            href={`tel:${job.reporter.phone}`}
                            className="h-8 px-2.5 rounded-lg border border-[#ccd5c7] bg-white text-xs font-bold text-[#3d5648] flex items-center gap-1 hover:bg-[#eef3e8]"
                          >
                            <Phone size={13} /> Call
                          </a>
                        )}
                        <button
                          onClick={() => openWeighModal(job)}
                          className="h-8 px-3.5 rounded-lg bg-[#e36338] text-xs font-extrabold text-white flex items-center gap-1 hover:bg-[#ce532b] shadow-xs"
                        >
                          <Scale size={14} /> Weigh & Verify
                        </button>
                      </div>
                    </div>

                    {/* Reported items checklist */}
                    <div className="pt-2 border-t border-[#e2e7dc] flex items-center justify-between text-xs font-semibold text-[#4e6457]">
                      <span>
                        Items: {job.items.map((i) => `${i.qty} ${i.unit} ${i.category}`).join(', ')}
                      </span>
                      <span>Est: ~{job.estKg} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dispatch Aggregated Lots to Recycler */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-4">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#547934]">
                Vehicle Inventory & Dispatch
              </div>
              <h2 className="text-base font-extrabold text-[#183f32] mt-0.5">
                Deliver to Recycling Facility
              </h2>
              <p className="text-xs text-[#63796d] font-medium mt-0.5">
                Aggregated materials are dispatched once per lot, creating a traceable manifest seal.
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1.5">
                Choose Stream in Vehicle:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['plastic', 'paper', 'organic', 'metal', 'glass'] as CategoryId[]).map((cat) => {
                  const kg = undeliveredByCat[cat] || 0
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDispatchCategory(cat)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-extrabold transition flex justify-between items-center ${
                        dispatchCategory === cat
                          ? 'border-[#183f32] bg-[#f0f6eb] ring-2 ring-[#70954b]'
                          : 'border-[#dce2d7] bg-white text-[#455c50]'
                      }`}
                    >
                      <span className="capitalize">{cat}</span>
                      <span className="text-[11px] font-bold text-[#62776c]">{kg} kg</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Matched Facility */}
            <div className="p-3.5 rounded-xl border border-[#d7e3ce] bg-[#f4f9ef] space-y-1.5 text-xs">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#3d6023]">
                Top Verified Facility Match:
              </div>
              {topFacility ? (
                <div>
                  <div className="font-extrabold text-[#183f32] text-sm">
                    {topFacility.partner.name}
                  </div>
                  <div className="text-[#55695d]">
                    {topFacility.partner.method} · {topFacility.partner.credential}
                  </div>
                  <div className="text-[11px] font-bold text-[#356121] mt-1">
                    Match Score: {topFacility.score}/100 · Price: ₹{topFacility.rate}/kg
                  </div>
                </div>
              ) : (
                <div className="text-[#7c5b1e]">
                  No facility available for this category in the district.
                </div>
              )}
            </div>

            {/* Dispatch Action */}
            <button
              disabled={linesForCategory.length === 0 || !topFacility || dispatching}
              onClick={handleDispatch}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#102d24] disabled:opacity-40"
            >
              <Send size={15} />
              <span>
                Dispatch {totalCategoryKg} kg {dispatchCategory}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Doorstep Scale Weigh-in Modal */}
      {activeWeighReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
            <div className="border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
                  Certified Doorstep Weigh-in
                </div>
                <h2 className="font-display text-xl text-[#183f32]">
                  Examine & Certify: {activeWeighReq.id}
                </h2>
              </div>
              <button
                onClick={() => setActiveWeighReq(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
              {/* Human Cross-Check Instructions */}
              <div className="p-3 rounded-xl border border-[#d8e3ce] bg-[#f0f6eb] text-[#3c592a] font-semibold space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Physical Contamination Cross-Check
                </div>
                <p>
                  1. Check bags: Are bottles rinsed and dry? Is food waste completely separated?<br />
                  2. Enter scale reading in kg. Add any additional stream rows found at doorstep.
                </p>
              </div>

              {/* Streams weigh-in inputs */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#183f32]">Material Streams Measured:</span>
                  <button
                    type="button"
                    onClick={addExtraStreamLine}
                    className="text-[11px] font-bold text-[#446b2b] flex items-center gap-1 hover:underline"
                  >
                    <Plus size={13} /> Add Found Stream
                  </button>
                </div>

                <div className="space-y-2">
                  {weighEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-[#dbe2d5] bg-white"
                    >
                      <select
                        value={entry.category}
                        onChange={(e) => {
                          const cat = e.target.value as CategoryId
                          setWeighEntries(
                            weighEntries.map((item, i) => (i === idx ? { ...item, category: cat } : item))
                          )
                        }}
                        className="h-9 px-2.5 rounded-lg border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name[lang] || c.name.en}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center h-9 px-2 rounded-lg border border-[#d2d9cc] bg-white flex-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={entry.kg}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setWeighEntries(
                              weighEntries.map((item, i) => (i === idx ? { ...item, kg: val } : item))
                            )
                          }}
                          className="w-full text-xs font-extrabold text-[#183f32] bg-transparent outline-none text-right pr-1"
                        />
                        <span className="text-[11px] font-bold text-[#62776c]">kg</span>
                      </div>

                      {weighEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setWeighEntries(weighEntries.filter((_, i) => i !== idx))}
                          className="text-[#ba472f] p-1.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Segregation Rating */}
              <div className="pt-2">
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1.5">
                  Segregation Quality Assessment (Rates citizen sorting):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'good', label: 'Well Sorted', sub: 'Clean & unmixed' },
                    { id: 'partial', label: 'Partly Sorted', sub: 'Minor residue' },
                    { id: 'poor', label: 'Mixed / Contaminated', sub: 'Requires resort' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSegregationRating(s.id as Segregation)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        segregationRating === s.id
                          ? 'border-[#183f32] bg-[#f0f6eb] ring-2 ring-[#70954b]'
                          : 'border-[#dce2d7] bg-white text-[#455c50]'
                      }`}
                    >
                      <div className="text-xs font-extrabold text-[#183f32]">{s.label}</div>
                      <div className="text-[10px] text-[#6d7e74] mt-0.5">{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification PIN */}
              <div className="pt-2">
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Citizen Hand-off Verification PIN:
                </label>
                <input
                  value={handOffPin}
                  onChange={(e) => setHandOffPin(e.target.value)}
                  placeholder="e.g. 4812"
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white font-mono text-xs font-extrabold text-[#183f32] outline-none"
                />
              </div>
            </div>

            <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWeighReq(null)}
                className="text-xs font-bold text-[#62776c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCollection}
                className="flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#102d24]"
              >
                <Check size={15} /> Certify & Save Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
