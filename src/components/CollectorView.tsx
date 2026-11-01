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
  Minus,
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
  const { t, tr, lang } = useT()

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
  // Issue 11: Verification PIN should be blank initially
  const [handOffPin, setHandOffPin] = useState('')

  // Dispatch to Facility state
  const [dispatchCategory, setDispatchCategory] = useState<CategoryId>('plastic')
  // Issue 12: Adjustable dispatch weight
  const [customDispatchKg, setCustomDispatchKg] = useState<number | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null)

  function openWeighModal(req: WasteRequest) {
    setActiveWeighReq(req)
    setHandOffPin('')
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
  const activeDispatchKg = customDispatchKg !== null ? customDispatchKg : totalCategoryKg

  // Facility matches for this category
  const facilityMatches = rankFacilities(state, dispatchCategory, currentCollector.baseWard)
  const topFacility = facilityMatches.find((f) => f.eligible)

  function handleCategorySelect(cat: CategoryId) {
    setDispatchCategory(cat)
    setCustomDispatchKg(null)
  }

  function handleDispatch() {
    if (!topFacility || linesForCategory.length === 0) return
    setDispatching(true)
    const refs = linesForCategory.map((l) => ({ requestId: l.reqId, lineId: l.lineId }))
    const lotId = actions.dispatch(currentCollector.id, topFacility.partner.id, dispatchCategory, refs)
    setDispatching(false)
    if (lotId) {
      setDispatchSuccess(`${tr('Dispatched')} ${activeDispatchKg} kg ${tr(dispatchCategory)} to ${topFacility.partner.name} under Manifest ${lotId}`)
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
              {tr('Awaiting Delivery')}
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
                  <Clock3 size={15} /> {tr('New Pickup Offers Waiting for You')} ({myOffers.length})
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
                        {offer.items.map((i) => tr(i.category)).join(', ')})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => actions.decline(offer.id, currentCollector.id, 'Route full')}
                        className="px-3 py-1.5 rounded-lg border border-[#e0c4b4] text-xs font-extrabold text-[#aa3d24] hover:bg-[#fff0eb]"
                      >
                        {tr('Decline')}
                      </button>
                      <button
                        type="button"
                        onClick={() => actions.accept(offer.id, currentCollector.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#183f32] text-xs font-extrabold text-[#dff47d] hover:bg-[#102d24] shadow-xs"
                      >
                        {tr('Accept Stop')}
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
                  {tr('Daily Route & Doorstep Pickups')} ({myAssigned.length})
                </h2>
                <p className="text-xs text-[#63796d] font-medium mt-0.5">
                  {tr('Arrive with calibrated scale, examine segregation quality, and log true door weights.')}
                </p>
              </div>
            </div>

            {myAssigned.length === 0 ? (
              <div className="text-xs text-[#718579] text-center py-8 border border-dashed border-[#dce2d7] rounded-xl">
                {tr('No active pickups scheduled. Accept an offer above or wait for ward routing.')}
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
                            {job.kind === 'dumping' ? tr('OPEN DUMPING') : tr('DOORSTEP PICKUP')}
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

                      <div className="text-right">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6a8073]">
                          Est. Load
                        </div>
                        <div className="text-sm font-extrabold text-[#183f32]">
                          ~{job.estKg} kg
                        </div>
                      </div>
                    </div>

                    {/* Reported items list */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.items.map((line) => {
                        const cat = CATEGORIES.find((c) => c.id === line.category)
                        return (
                          <span
                            key={line.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#dce2d7] bg-white text-[#344d41]"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: cat?.color }}
                            />
                            <span>{cat?.name[lang] || cat?.name.en}</span>
                            <span className="opacity-70">
                              ({line.qty} {line.unit})
                            </span>
                          </span>
                        )
                      })}
                    </div>

                    {/* Action button */}
                    <div className="pt-2 border-t border-[#e2e7dc] flex items-center justify-between">
                      <a
                        href={`tel:${job.reporter.phone}`}
                        className="text-xs font-bold text-[#3d594b] flex items-center gap-1 hover:underline"
                      >
                        <Phone size={13} /> {job.reporter.phone || 'Resident'}
                      </a>

                      <button
                        type="button"
                        onClick={() => openWeighModal(job)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#183f32] text-xs font-extrabold text-[#dff47d] shadow-sm hover:bg-[#112f25]"
                      >
                        <Scale size={14} />
                        <span>{tr('Doorstep Weigh-in')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vehicle Inventory & Dispatch */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-4">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567534]">
                {tr('Vehicle Inventory & Facility Dispatch')}
              </div>
              <h2 className="font-display text-lg text-[#183f32] mt-0.5">
                {tr('Vehicle Load & Dispatch')}
              </h2>
              <p className="text-xs text-[#63796d] font-medium mt-1">
                {tr('Aggregated materials are dispatched once per lot, creating a traceable manifest seal.')}
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1.5">
                {tr('Active Waste Stream:')}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['plastic', 'paper', 'organic', 'metal', 'glass'] as CategoryId[]).map((cat) => {
                  const kg = undeliveredByCat[cat] || 0
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-extrabold transition flex justify-between items-center ${
                        dispatchCategory === cat
                          ? 'border-[#183f32] bg-[#f0f6eb] ring-2 ring-[#70954b]'
                          : 'border-[#dce2d7] bg-white text-[#455c50]'
                      }`}
                    >
                      <span className="capitalize">{tr(cat)}</span>
                      <span className="text-[11px] font-bold text-[#62776c]">{kg} kg</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Matched Facility */}
            <div className="p-3.5 rounded-xl border border-[#d7e3ce] bg-[#f4f9ef] space-y-1.5 text-xs">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#3d6023]">
                {tr('Top Verified Facility Match:')}
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

            {/* Issue 12: Adjustable Weight Control */}
            <div className="p-3 rounded-xl border border-[#d2d9cc] bg-[#fafbf7] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#3a5245]">
                  {tr('Dispatch Weight (Adjustable):')}
                </span>
                <span className="text-[10px] text-[#697f72] font-semibold">
                  {tr('Weight adjustment option')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomDispatchKg(round1(Math.max(0.1, activeDispatchKg - 1.0)))}
                  className="h-9 w-9 rounded-xl bg-white border border-[#cbd5c4] font-black text-sm text-[#183f32] hover:bg-[#e4ecdc] active:scale-95 transition grid place-items-center"
                  title="Decrease weight by 1 kg"
                >
                  <Minus size={15} />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={activeDispatchKg}
                    onChange={(e) => setCustomDispatchKg(round1(Math.max(0.1, parseFloat(e.target.value) || 0.1)))}
                    className="w-full h-9 px-3 text-center rounded-xl border border-[#ccd6c5] bg-white font-mono text-sm font-extrabold text-[#183f32] outline-none focus:border-[#527733]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#62776b]">kg</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomDispatchKg(round1(activeDispatchKg + 1.0))}
                  className="h-9 w-9 rounded-xl bg-white border border-[#cbd5c4] font-black text-sm text-[#183f32] hover:bg-[#e4ecdc] active:scale-95 transition grid place-items-center"
                  title="Increase weight by 1 kg"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Dispatch Action */}
            <button
              type="button"
              disabled={linesForCategory.length === 0 || !topFacility || dispatching}
              onClick={handleDispatch}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#102d24] disabled:opacity-40 transition"
            >
              <Send size={15} />
              <span>
                {tr('Dispatch Weight (Adjustable):')} {activeDispatchKg} kg {tr(dispatchCategory)}
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
                  {tr('Certified Doorstep Weigh-in')}
                </div>
                <h2 className="font-display text-xl text-[#183f32]">
                  {tr('Examine & Certify')}: {activeWeighReq.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveWeighReq(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="text-xs text-[#4e6457] font-semibold bg-[#edf4e4] p-3 rounded-xl border border-[#d6e3cb]">
                {tr('Collector Rule:')} <strong>{tr('Only scale readings count as collected weight.')}</strong> {tr('Visual estimates are discarded.')}
              </div>

              {/* Weigh entries */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold text-[#3a5245] block">
                  {tr('Actual Scale Weights per Stream (kg):')}
                </label>
                {weighEntries.map((entry, index) => {
                  const cat = CATEGORIES.find((c) => c.id === entry.category)
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-[#dce3d6] bg-white"
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color }}
                      />
                      <select
                        value={entry.category}
                        onChange={(e) => {
                          const updated = [...weighEntries]
                          updated[index].category = e.target.value as CategoryId
                          setWeighEntries(updated)
                        }}
                        className="h-9 px-2 rounded-lg border border-[#d2d9cc] bg-[#fafbf8] text-xs font-bold text-[#183f32] outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name[lang] || c.name.en}
                          </option>
                        ))}
                      </select>

                      <div className="flex-1 flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={entry.kg}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            const updated = [...weighEntries]
                            updated[index].kg = val
                            setWeighEntries(updated)
                          }}
                          className="w-24 h-9 px-2 text-right rounded-lg border border-[#ccd6c5] bg-white font-mono text-xs font-extrabold text-[#183f32] outline-none"
                        />
                        <span className="text-xs font-bold text-[#64796d]">kg</span>
                      </div>

                      {weighEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setWeighEntries(weighEntries.filter((_, i) => i !== index))}
                          className="p-1.5 text-[#a8442a] hover:bg-[#fff0eb] rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )
                })}

                <button
                  type="button"
                  onClick={addExtraStreamLine}
                  className="flex items-center gap-1 text-xs font-bold text-[#3d6525] hover:underline pt-1"
                >
                  <Plus size={14} /> {tr('Add Extra Stream Found at Doorstep')}
                </button>
              </div>

              {/* Segregation Rating */}
              <div className="pt-2 border-t border-[#e2e6dc]">
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1.5">
                  {tr('Doorstep Segregation Quality Inspection:')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'good', label: tr('Good (Clean/Sorted)'), color: 'border-[#6ba343] text-[#2c5b1b]' },
                    { id: 'partial', label: tr('Partial (Mild Mix)'), color: 'border-[#df9e38] text-[#7a4c14]' },
                    { id: 'poor', label: tr('Poor (Unsorted)'), color: 'border-[#d45638] text-[#8e2912]' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSegregationRating(r.id as Segregation)}
                      className={`p-2 rounded-xl border text-center text-xs font-extrabold transition ${
                        segregationRating === r.id
                          ? `bg-[#f0f6eb] ${r.color} ring-2 ring-[#70954b]`
                          : 'border-[#d5ded0] bg-white text-[#586c60]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Issue 11: Verification PIN (Initially blank) */}
              <div className="pt-2">
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  {tr('Citizen Hand-off Verification PIN:')}
                </label>
                <input
                  value={handOffPin}
                  onChange={(e) => setHandOffPin(e.target.value)}
                  placeholder="e.g. 4812"
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white font-mono text-xs font-extrabold text-[#183f32] outline-none"
                />
              </div>
            </div>

            <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWeighReq(null)}
                className="text-xs font-bold text-[#5e7166]"
              >
                {tr('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveCollection}
                className="flex items-center gap-1.5 rounded-xl bg-[#183f32] text-xs font-extrabold text-[#dff47d] px-5 py-2.5 shadow-md hover:bg-[#112d23]"
              >
                <Check size={14} />
                <span>{tr('Save Doorstep Scale Weights')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
