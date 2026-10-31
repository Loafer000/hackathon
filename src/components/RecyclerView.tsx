import React, { useState } from 'react'
import {
  Factory,
  Scale,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Recycle,
  Clock3,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT } from '../lib/i18n'
import { CATEGORIES } from '../lib/data'
import { round1, fmtDateTime } from '../lib/format'
import type { Lot, RejectRoute } from '../lib/types'

export function RecyclerView() {
  const { session, partners, lots } = useApp()
  const { lang } = useT()

  const currentFacility = partners.find((p) => p.id === session.facilityId) || partners.find((p) => p.kind === 'facility')!

  // Lots for this facility
  const myLots = lots.filter((l) => l.facilityId === currentFacility.id)
  const incomingLots = myLots.filter((l) => l.status === 'in_transit')
  const receivedLots = myLots.filter((l) => l.status === 'received')
  const processedLots = myLots.filter((l) => l.status === 'processed')

  // Weighbridge Modal state
  const [activeReceiptLot, setActiveReceiptLot] = useState<Lot | null>(null)
  const [scaleReceiptKg, setScaleReceiptKg] = useState<number>(0)

  // Recovery Outcome Modal state
  const [activeProcessLot, setActiveProcessLot] = useState<Lot | null>(null)
  const [recoveredKg, setRecoveredKg] = useState<number>(0)
  const [rejectedKg, setRejectedKg] = useState<number>(0)
  const [rejectRoute, setRejectRoute] = useState<RejectRoute>('coprocessing')
  const [outputDesc, setOutputDesc] = useState<string>('Washed flakes / Granules')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  function openReceiptModal(lot: Lot) {
    setActiveReceiptLot(lot)
    setScaleReceiptKg(lot.dispatchedKg)
  }

  function handleConfirmReceipt() {
    if (!activeReceiptLot) return
    actions.receive(activeReceiptLot.id, scaleReceiptKg)
    setActiveReceiptLot(null)
    setSaveSuccess(`Weighbridge ticket confirmed for ${activeReceiptLot.id}: ${scaleReceiptKg} kg received.`)
    setTimeout(() => setSaveSuccess(null), 4000)
  }

  function openProcessModal(lot: Lot) {
    setActiveProcessLot(lot)
    const inbound = lot.receivedKg || lot.dispatchedKg
    const defaultRec = round1(inbound * 0.85)
    const defaultRej = round1(inbound - defaultRec)
    setRecoveredKg(defaultRec)
    setRejectedKg(defaultRej)
    setOutputDesc(
      lot.category === 'plastic'
        ? 'Washed HDPE/PP Granules'
        : lot.category === 'organic'
        ? 'Windrow City Compost'
        : lot.category === 'paper'
        ? 'Baled fiber for paper mill'
        : 'Sorted scrap fractions'
    )
  }

  function handleSaveOutcome() {
    if (!activeProcessLot) return
    actions.process(activeProcessLot.id, {
      primaryKg: recoveredKg,
      rejectedKg,
      rejectRoute,
      output: outputDesc,
    })
    setActiveProcessLot(null)
    setSaveSuccess(`Recovery record certified for ${activeProcessLot.id}. Output locked in ledger.`)
    setTimeout(() => setSaveSuccess(null), 4000)
  }

  // Monthly statistics for this facility
  const totalReceivedKg = round1(
    processedLots.reduce((acc, l) => acc + (l.receivedKg || 0), 0)
  )
  const totalRecoveredKg = round1(
    processedLots.reduce((acc, l) => acc + (l.recoveredKg || 0), 0)
  )
  const totalRejectedKg = round1(
    processedLots.reduce((acc, l) => acc + (l.rejectedKg || 0), 0)
  )
  const recoveryYieldPct = totalReceivedKg > 0 ? Math.round((totalRecoveredKg / totalReceivedKg) * 100) : 88

  return (
    <div className="space-y-6">
      {/* Facility Profile Banner */}
      <div className="rounded-2xl border border-[#d6e2cf] bg-[#f0f6ea] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-[#183f32] text-[#dff47d] grid place-items-center shadow-xs">
            <Factory size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl text-[#183f32]">
                {currentFacility.name}
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#3b6021] bg-[#dbe8cb] px-2 py-0.5 rounded">
                <ShieldCheck size={12} /> {currentFacility.status.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#506659] mt-0.5">
              {currentFacility.org} · {currentFacility.method} · Daily Cap: {currentFacility.capacity} kg
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#637a6e]">
              Certified Recovered
            </div>
            <div className="text-lg font-extrabold text-[#285b20]">
              {totalRecoveredKg} kg ({recoveryYieldPct}% Yield)
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-[#b8df9c] bg-[#eefae4] text-xs font-extrabold text-[#29561b]">
          <CheckCircle2 size={16} /> {saveSuccess}
        </div>
      )}

      {/* Main Grid: Incoming & Processing Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incoming In-Transit Lots */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#183f32] flex items-center gap-2">
                  <Clock3 size={17} className="text-[#648737]" />
                  Inbound Lots In Transit ({incomingLots.length})
                </h2>
                <p className="text-xs text-[#63796d] font-medium mt-0.5">
                  Weigh vehicle at facility weighbridge upon arrival to confirm receipt.
                </p>
              </div>
            </div>

            {incomingLots.length === 0 ? (
              <div className="text-xs text-[#718579] text-center py-6 border border-dashed border-[#dce2d7] rounded-xl">
                No vehicles currently en route. Collector dispatches will appear here.
              </div>
            ) : (
              <div className="space-y-2.5">
                {incomingLots.map((lot) => {
                  const cat = CATEGORIES.find((c) => c.id === lot.category)!
                  return (
                    <div
                      key={lot.id}
                      className="p-3.5 rounded-xl border border-[#dbe2d6] bg-[#fafbf8] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#183f32]">
                            Manifest {lot.id}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#3a6828] bg-[#e4eed9] px-2 py-0.5 rounded">
                            {cat.name[lang] || cat.name.en}
                          </span>
                        </div>
                        <div className="text-xs text-[#52695c] font-medium mt-0.5">
                          Dispatched: {lot.dispatchedKg} kg · Collector: {lot.collectorId} · {lot.refs.length} household batches
                        </div>
                      </div>

                      <button
                        onClick={() => openReceiptModal(lot)}
                        className="h-8 px-3.5 rounded-lg bg-[#183f32] text-xs font-extrabold text-[#dff47d] hover:bg-[#102d24] flex items-center gap-1 shadow-xs"
                      >
                        <Scale size={14} /> Log Weighbridge Ticket
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Lots Awaiting Recovery Processing */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#183f32] flex items-center gap-2">
                  <PackageCheck size={17} className="text-[#648737]" />
                  Received Lots Ready for Processing ({receivedLots.length})
                </h2>
                <p className="text-xs text-[#63796d] font-medium mt-0.5">
                  Record final sorted outputs, recovery yields, and rejected residual routes.
                </p>
              </div>
            </div>

            {receivedLots.length === 0 ? (
              <div className="text-xs text-[#718579] text-center py-6 border border-dashed border-[#dce2d7] rounded-xl">
                All received loads have been processed and certified.
              </div>
            ) : (
              <div className="space-y-2.5">
                {receivedLots.map((lot) => {
                  const cat = CATEGORIES.find((c) => c.id === lot.category)!
                  return (
                    <div
                      key={lot.id}
                      className="p-3.5 rounded-xl border border-[#dbe2d6] bg-[#fafbf8] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#183f32]">
                            Lot {lot.id}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#3a6828] bg-[#e4eed9] px-2 py-0.5 rounded">
                            {cat.name[lang] || cat.name.en}
                          </span>
                        </div>
                        <div className="text-xs text-[#52695c] font-medium mt-0.5">
                          Received Scale: {lot.receivedKg} kg · Dispatched: {lot.dispatchedKg} kg
                        </div>
                      </div>

                      <button
                        onClick={() => openProcessModal(lot)}
                        className="h-8 px-3.5 rounded-lg bg-[#e36338] text-xs font-extrabold text-white hover:bg-[#cf552c] flex items-center gap-1 shadow-xs"
                      >
                        <Recycle size={14} /> Record Recovery Outcome
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mass Balance & Locked Ledger */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-4">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#547934]">
                Mass Balance Accounting
              </div>
              <h2 className="text-base font-extrabold text-[#183f32] mt-0.5">
                Closed Loop Mass Ledger
              </h2>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f2f7ec] border border-[#d5e2cd] space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#4d6656]">
                <span>Total Inbound Received:</span>
                <span className="text-[#183f32]">{totalReceivedKg} kg</span>
              </div>
              <div className="flex justify-between font-bold text-[#4d6656]">
                <span>Certified Recovered:</span>
                <span className="text-[#2b601e]">{totalRecoveredKg} kg</span>
              </div>
              <div className="flex justify-between font-bold text-[#4d6656]">
                <span>Rejected & Rerouted:</span>
                <span className="text-[#96371c]">{totalRejectedKg} kg</span>
              </div>
              <div className="border-t border-[#d5ded0] pt-2 flex justify-between font-extrabold text-[#183f32]">
                <span>Overall Yield Rate:</span>
                <span>{recoveryYieldPct}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#fffaf0] border border-[#ecd9b0] text-[11px] text-[#78531e] font-semibold leading-relaxed">
              <AlertTriangle size={15} className="inline mr-1 text-[#a66d1f]" />
              <strong>Double-Counting Prevention:</strong> Recovered outputs are cryptographically sealed in the ledger. Individual source batch shares are apportioned strictly according to input mass.
            </div>

            {/* Recent Processed Lots */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-extrabold text-[#3a5245]">
                Certified Records ({processedLots.length}):
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {processedLots.slice(0, 5).map((lot) => (
                  <div
                    key={lot.id}
                    className="p-2.5 rounded-lg border border-[#e1e6db] bg-[#fafbf8] text-xs font-medium space-y-1"
                  >
                    <div className="flex justify-between font-bold text-[#183f32]">
                      <span>{lot.id} ({lot.category})</span>
                      <span className="text-[#356321]">{lot.recoveredKg} kg recovered</span>
                    </div>
                    <div className="text-[10px] text-[#697d71] flex justify-between">
                      <span>Out: {lot.output}</span>
                      <span>Rej: {lot.rejectedKg} kg ({lot.rejectRoute})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weighbridge Inbound Receipt Modal */}
      {activeReceiptLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
            <div className="border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-[#183f32]">
                Log Weighbridge Gross: {activeReceiptLot.id}
              </h3>
              <button
                onClick={() => setActiveReceiptLot(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-medium">
              <div className="flex justify-between text-[#53685c]">
                <span>Collector Dispatched Weight:</span>
                <span className="font-extrabold text-[#183f32]">{activeReceiptLot.dispatchedKg} kg</span>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Weighbridge Scale Reading (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={scaleReceiptKg}
                  onChange={(e) => setScaleReceiptKg(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3 rounded-xl border border-[#d2d9cc] bg-white font-mono text-sm font-extrabold text-[#183f32] outline-none"
                />
              </div>

              {Math.abs(scaleReceiptKg - activeReceiptLot.dispatchedKg) / activeReceiptLot.dispatchedKg > 0.05 && (
                <div className="p-3 rounded-xl border border-[#f0c2b2] bg-[#fff3ee] text-[#a0361d] font-bold">
                  Weight differs from collector dispatch by {Math.round((Math.abs(scaleReceiptKg - activeReceiptLot.dispatchedKg) / activeReceiptLot.dispatchedKg) * 100)}%. Discrepancy flag will be noted on audit trail.
                </div>
              )}
            </div>

            <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveReceiptLot(null)}
                className="text-xs font-bold text-[#62776c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReceipt}
                className="h-10 px-5 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#102d24]"
              >
                Confirm Inbound Intake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Processing & Mass Balance Modal */}
      {activeProcessLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
            <div className="border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
                  Certified Material Recovery
                </div>
                <h3 className="font-display text-lg text-[#183f32]">
                  Record Outputs: Lot {activeProcessLot.id}
                </h3>
              </div>
              <button
                onClick={() => setActiveProcessLot(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-medium">
              <div className="p-3 rounded-xl bg-[#f0f6ea] border border-[#d4e1cd] flex justify-between font-extrabold text-[#23461c]">
                <span>Inbound Material to Balance:</span>
                <span>{activeProcessLot.receivedKg || activeProcessLot.dispatchedKg} kg</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                    Recovered / Recycled Output (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={recoveredKg}
                    onChange={(e) => setRecoveredKg(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white font-mono text-xs font-extrabold text-[#183f32] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                    Rejected Impurities (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rejectedKg}
                    onChange={(e) => setRejectedKg(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white font-mono text-xs font-extrabold text-[#183f32] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Where do the rejected contaminants go?
                </label>
                <select
                  value={rejectRoute}
                  onChange={(e) => setRejectRoute(e.target.value as RejectRoute)}
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                >
                  <option value="coprocessing">Cement Kiln Co-processing (Refuse Derived Fuel)</option>
                  <option value="landfill">Engineered Sanitary Landfill</option>
                  <option value="returned">Returned to Collector for segregation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Output Product Description
                </label>
                <input
                  value={outputDesc}
                  onChange={(e) => setOutputDesc(e.target.value)}
                  placeholder="e.g. Washed PET flakes, Organic compost"
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f2f7ec] border border-[#d6e3cd] text-[#3e582d] font-bold">
                Balance Check: {recoveredKg} kg recovered + {rejectedKg} kg rejected = {round1(recoveredKg + rejectedKg)} kg accounted for.
              </div>
            </div>

            <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveProcessLot(null)}
                className="text-xs font-bold text-[#62776c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutcome}
                className="h-10 px-5 rounded-xl bg-[#e36338] text-white text-xs font-extrabold shadow-md hover:bg-[#cf552c]"
              >
                Certify & Lock Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
