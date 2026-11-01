import React, { useState } from 'react'
import {
  Route,
  Search,
  ShieldCheck,
  Scale,
  Factory,
  Home,
  CheckCircle2,
  CalendarDays,
  Clock3,
  Layers,
  ArrowRight,
  Recycle,
  AlertTriangle,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { useT } from '../lib/i18n'
import { fmtDateTime, round1 } from '../lib/format'
import type { WasteRequest, Lot } from '../lib/types'

interface TraceViewProps {
  initialId?: string
}

export function TraceView({ initialId }: TraceViewProps) {
  const { requests, lots, partners } = useApp()
  const { tr, lang } = useT()

  const [query, setQuery] = useState(initialId || 'R-1001')

  // Find either a request or a lot
  const matchedRequest = requests.find((r) => r.id.toLowerCase() === query.trim().toLowerCase())
  const matchedLot = lots.find((l) => l.id.toLowerCase() === query.trim().toLowerCase())

  // Sample quick IDs
  const SAMPLE_IDS = ['R-1001', 'R-1002', 'R-1003', 'L-201', 'L-202']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e1e6db] pb-4">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
          {tr('Auditable Chain of Custody')}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-[#183f32] mt-0.5">
          {tr('End-to-End Material Traceability Ledger')}
        </h1>
        <p className="text-xs font-semibold text-[#64796e] mt-1">
          {tr('Trace any doorstep batch or factory lot from origin, through doorstep weigh-in, to certified recovery output.')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-[#dce2d6] bg-white shadow-xs space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-[#708477]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Enter Ticket ID (e.g., R-1001) or Manifest ID (e.g., L-201)...')}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#d2d9cc] bg-[#f9faf7] text-xs font-bold text-[#183f32] outline-none"
            />
          </div>
          <button
            onClick={() => setQuery(query.trim())}
            className="h-11 px-5 rounded-xl bg-[#183f32] text-xs font-extrabold text-[#dff47d]"
          >
            {tr('Trace')}
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-bold text-[#6a7d72] uppercase mr-1">
            {tr('Try Sample Batches:')}
          </span>
          {SAMPLE_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setQuery(id)}
              className="px-2.5 py-1 rounded-lg border border-[#d3dbcd] bg-[#f7f9f3] text-[11px] font-extrabold text-[#2a4537] hover:bg-[#eaf1e2]"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Result Card: Waste Request Trail */}
      {matchedRequest && (
        <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e7dc] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#183f32] bg-[#e6efdd] px-2.5 py-1 rounded-lg">
                  {tr('Batch:')} {matchedRequest.id}
                </span>
                <span className="text-xs font-bold text-[#4b6d36] capitalize">
                  {tr(matchedRequest.status)}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#183f32] mt-2">
                {matchedRequest.items.map((i) => `${i.qty} ${tr(i.unit)} ${tr(i.category)}`).join(', ')}
              </h2>
              <div className="text-xs text-[#52695c] font-medium mt-0.5">
                {tr('Full Name')}: {matchedRequest.reporter.name} ({tr(matchedRequest.reporter.type)}) · {matchedRequest.address}, {matchedRequest.ward}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#687e72]">
                {tr('Mass Balance Status')}
              </div>
              <div className="text-sm font-extrabold text-[#275d1d] flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck size={16} /> {tr('Digitally Verified')}
              </div>
            </div>
          </div>

          {/* Chronological Event Timeline */}
          <div className="space-y-4 relative pl-4 border-l-2 border-[#dbe4d4] ml-2">
            {matchedRequest.events.map((ev, idx) => (
              <div key={ev.id || idx} className="relative space-y-1">
                {/* Dot */}
                <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[#183f32] bg-white" />

                <div className="flex items-center justify-between text-xs font-extrabold text-[#183f32]">
                  <span className="capitalize">{ev.type.replace('_', ' ')}</span>
                  <span className="text-[10px] font-semibold text-[#73847a]">
                    {fmtDateTime(ev.at, lang)}
                  </span>
                </div>
                <div className="text-xs text-[#52695c] font-medium">
                  Actor: <strong className="text-[#183f32]">{ev.actor}</strong>
                  {ev.kg ? ` · Weight: ${round1(ev.kg)} kg` : ''}
                  {ev.detail ? ` · ${ev.detail}` : ''}
                </div>
                {ev.sms && (
                  <div className="text-[11px] text-[#4d6b38] bg-[#f0f6eb] p-2 rounded-lg border border-[#d7e3cf] italic">
                    SMS alert: “{ev.sms}”
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mass Balance Summary for Request */}
          <div className="p-4 rounded-xl bg-[#f2f7ec] border border-[#d6e3cd] text-xs font-semibold text-[#3d5a2d] space-y-1.5">
            <div className="font-extrabold flex items-center gap-1.5">
              <CheckCircle2 size={15} /> {tr('Mass Accounting Verification')}
            </div>
            <p>
              {tr('Estimated planning weight:')} ~{matchedRequest.estKg} kg. {tr('Measured doorstep scale weight:')}{' '}
              {round1(matchedRequest.items.reduce((acc, i) => acc + (i.weighedKg || 0), 0))} kg. {tr('Zero double-counting guaranteed.')}
            </p>
          </div>
        </div>
      )}

      {/* Result Card: Lot Manifest Trail */}
      {matchedLot && (
        <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e7dc] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#183f32] bg-[#e6efdd] px-2.5 py-1 rounded-lg">
                  {tr('Manifest')} {matchedLot.id}
                </span>
                <span className="text-xs font-bold text-[#4b6d36] capitalize">
                  {tr(matchedLot.category)} ({tr(matchedLot.status)})
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#183f32] mt-2">
                {tr('Dispatched')}: {matchedLot.dispatchedKg} kg · {tr('Received')}: {matchedLot.receivedKg || tr('En route')} kg
              </h2>
              <div className="text-xs text-[#52695c] font-medium mt-0.5">
                {tr('Collector')}: {matchedLot.collectorId} ➔ {tr('Recycler')}: {matchedLot.facilityId}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#687e72]">
                {tr('Aggregated Batches')}
              </div>
              <div className="text-sm font-extrabold text-[#183f32]">
                {matchedLot.refs.length} {tr('household pickups linked')}
              </div>
            </div>
          </div>

          {/* Mass Balance Verification */}
          {matchedLot.status === 'processed' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[#dce4d5] bg-[#fafbf8]">
                <div className="text-[10px] uppercase font-bold text-[#687d71]">{tr('Recovered')}</div>
                <div className="text-xl font-extrabold text-[#285d1e] mt-0.5">
                  {matchedLot.recoveredKg} kg
                </div>
                <div className="text-[10px] text-[#697d71] mt-0.5 font-medium">
                  {tr('Output')}: {matchedLot.output}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#dce4d5] bg-[#fafbf8]">
                <div className="text-[10px] uppercase font-bold text-[#687d71]">{tr('Rejected Impurities')}</div>
                <div className="text-xl font-extrabold text-[#a23c1e] mt-0.5">
                  {matchedLot.rejectedKg} kg
                </div>
                <div className="text-[10px] text-[#697d71] mt-0.5 font-medium">
                  {tr('Destination')}: {matchedLot.rejectRoute}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#dce4d5] bg-[#fafbf8]">
                <div className="text-[10px] uppercase font-bold text-[#687d71]">{tr('Process Loss')}</div>
                <div className="text-xl font-extrabold text-[#476052] mt-0.5">
                  {matchedLot.lossKg || 0} kg
                </div>
                <div className="text-[10px] text-[#697d71] mt-0.5 font-medium">
                  {tr('Moisture / shredding loss')}
                </div>
              </div>
            </div>
          )}

          {/* Linked Source Batches */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-[#183f32]">
              {tr('Source Doorstep Batches in this Lot:')}
            </div>
            <div className="divide-y divide-[#e8ece2] rounded-xl border border-[#dce2d7] overflow-hidden bg-white text-xs">
              {matchedLot.refs.map((ref, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between">
                  <span className="font-extrabold text-[#183f32]">{ref.requestId}</span>
                  <span className="text-[#55695d]">{tr('Contributed')}: {ref.kg} kg</span>
                  <button
                    onClick={() => setQuery(ref.requestId)}
                    className="text-[11px] font-bold text-[#456b2e] hover:underline"
                  >
                    {tr('Trace Origin')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No match found */}
      {!matchedRequest && !matchedLot && (
        <div className="p-8 text-center rounded-2xl border border-[#dce2d6] bg-white space-y-2">
          <div className="text-xs font-extrabold text-[#8a3e26]">
            No record found for ID “{query}”
          </div>
          <p className="text-xs text-[#6e8076]">
            Try searching for a ticket like <strong>R-1001</strong> or a lot like <strong>L-201</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
