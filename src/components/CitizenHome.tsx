import React, { useState } from 'react'
import {
  PlusCircle,
  Truck,
  PackageCheck,
  Recycle,
  CalendarDays,
  Clock3,
  MapPin,
  Mic,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
  Leaf,
  Scale,
  Phone,
  MessageSquare,
  AlertCircle,
  Flame,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT } from '../lib/i18n'
import { CATEGORIES, SLOT_LABEL } from '../lib/data'
import { fmtDay, round1 } from '../lib/format'
import type { WasteRequest, RequestStatus } from '../lib/types'

interface CitizenHomeProps {
  onStartReport: () => void
  onOpenVoice: () => void
  onSelectTrace: (id: string) => void
}

export function CitizenHome({ onStartReport, onOpenVoice, onSelectTrace }: CitizenHomeProps) {
  const { session, requests } = useApp()
  const { t, tr, lang } = useT()

  // Citizen's requests (or matched by ward/phone)
  const myRequests = requests.filter(
    (r) =>
      r.reporter.phone === session.userPhone ||
      r.reporter.name === session.userName ||
      r.ward === session.userWard
  )

  const activeRequest = myRequests.find(
    (r) => r.status === 'open' || r.status === 'assigned' || r.status === 'collected' || r.status === 'delivered'
  ) || myRequests[0]

  // Contact collector modal toggle
  const [contactOpen, setContactOpen] = useState(false)

  // Calculate citizen stats
  let myCollectedKg = 0
  let myRecoveredKg = 0
  myRequests.forEach((r) => {
    r.items.forEach((i) => {
      myCollectedKg += i.weighedKg || 0
      if (i.lotId) myRecoveredKg += (i.weighedKg || 0) * 0.85
    })
  })

  // 5-stage progress indicator
  function getStageIndex(status: RequestStatus): number {
    if (status === 'open') return 1
    if (status === 'assigned') return 2
    if (status === 'collected') return 3
    if (status === 'delivered') return 4
    if (status === 'closed') return 5
    return 1
  }

  const stage = activeRequest ? getStageIndex(activeRequest.status) : 1
  const STAGES = [
    { title: tr('Requested'), sub: tr('Ticket Created') },
    { title: tr('Matched'), sub: tr('Collector Assigned') },
    { title: tr('Collected'), sub: tr('Doorstep Scale') },
    { title: tr('At Facility'), sub: tr('Weighbridge Intake') },
    { title: tr('Recovered'), sub: tr('Certified Output') },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#173f32] p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dff47d]/15 text-[#dff47d] text-[10px] font-extrabold uppercase tracking-widest border border-[#dff47d]/20">
            <Sparkles size={13} /> {tr('Circular Waste Recovery Pilot')}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight">
            {t('home.hello', { name: session.userName })}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
            {tr('Sort with confidence, get doorstep collection from verified partners, and see your plastics, paper, and food waste transformed into certified resources.')}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onStartReport}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-[#dff47d] text-[#173f32] text-xs font-extrabold shadow-sm transition hover:bg-[#eeff9e]"
            >
              <PlusCircle size={16} /> {tr('Request Pickup')}
            </button>
            <button
              type="button"
              onClick={onOpenVoice}
              className="flex items-center gap-2 h-11 px-4 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-bold hover:bg-white/15"
            >
              <Mic size={16} /> {tr('Voice Instructions')}
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-[#dff47d]/10 blur-2xl pointer-events-none" />
      </div>

      {/* Active Pickup Tracker Card */}
      {activeRequest && (
        <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#597b37] bg-[#ebf3e2] px-2 py-0.5 rounded">
                  {tr('Active Request:')} {activeRequest.id}
                </span>
                <span className="text-xs font-bold text-[#62776c]">
                  {fmtDay(activeRequest.slot.date, lang)} ({SLOT_LABEL[activeRequest.slot.window]})
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-[#183f32] mt-1">
                {activeRequest.items.map((i) => `${i.qty} ${tr(i.unit)} ${tr(i.category)}`).join(', ')}
              </h2>
              <div className="text-xs text-[#526b5d] font-semibold flex items-center gap-1.5 mt-0.5">
                <MapPin size={13} className="text-[#64843b]" />
                <span>{activeRequest.address}, {activeRequest.ward}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#63796e]">
                {tr('Status')}
              </div>
              <div className="text-sm font-extrabold text-[#183f32] capitalize">
                {tr(activeRequest.status)}
              </div>
            </div>
          </div>

          {/* 5-Stage Step Progress Visualizer */}
          <div className="py-2">
            <div className="grid grid-cols-5 gap-1 relative">
              {STAGES.map((s, idx) => {
                const stepNum = idx + 1
                const isCompleted = stepNum < stage
                const isCurrent = stepNum === stage
                return (
                  <div key={s.title} className="text-center relative">
                    <div
                      className={`h-2 rounded-full mb-2 ${
                        isCompleted || isCurrent ? 'bg-[#3b6b27]' : 'bg-[#e2e7dc]'
                      }`}
                    />
                    <div
                      className={`text-[10px] font-extrabold ${
                        isCurrent
                          ? 'text-[#183f32]'
                          : isCompleted
                          ? 'text-[#446b2b]'
                          : 'text-[#8b9c91]'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="text-[9px] text-[#718478] hidden sm:block">
                      {s.sub}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-[#e2e6dc] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-[#4e6457]">
                {tr('Share Hand-off Code at door:')}
              </div>
              <span className="font-mono text-sm font-extrabold text-[#183f32] bg-[#f0f5eb] border border-[#d2decb] px-3 py-1 rounded-lg tracking-widest">
                4812
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTrace(activeRequest.id)}
                className="h-9 px-3.5 rounded-xl border border-[#d0d8cb] bg-white text-xs font-extrabold text-[#3b5446] hover:bg-[#f0f4ea] flex items-center gap-1.5"
              >
                <span>{tr('View Full Trail')}</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setContactOpen(!contactOpen)}
                className="h-9 px-3.5 rounded-xl bg-[#183f32] text-xs font-extrabold text-[#dff47d] hover:bg-[#102d24] flex items-center gap-1.5 shadow-xs"
              >
                <Phone size={13} />
                <span>{tr('Contact Collector')}</span>
              </button>
            </div>
          </div>

          {contactOpen && (
            <div className="p-3.5 rounded-xl border border-[#d8e3cf] bg-[#f3f8ee] flex items-center justify-between text-xs font-semibold">
              <div>
                <div className="font-extrabold text-[#183f32]">
                  {tr('Assigned Collector:')} Ravi Shinde (Swachh Seva Sahakari Sanstha)
                </div>
                <div className="text-[#55695d]">
                  {tr('Phone:')} 98190 33417 · {tr('Vehicle Registration No.')}: MH-12-TR-4021
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="tel:9819033417"
                  className="px-3 py-1.5 rounded-lg bg-[#183f32] text-[#dff47d] font-extrabold flex items-center gap-1"
                >
                  <Phone size={12} /> {tr('Call')}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Citizen Impact Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[#dce2d6] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#697f73]">
            <span>{tr('Collected')}</span>
            <Scale size={16} className="text-[#50742f]" />
          </div>
          <div className="text-2xl font-extrabold text-[#183f32]">
            {round1(myCollectedKg)} kg
          </div>
          <div className="text-[11px] text-[#6d7f74] font-medium">
            {tr('Doorstep scale weigh-in total')}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[#dce2d6] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#697f73]">
            <span>{tr('Recovered')}</span>
            <Recycle size={16} className="text-[#326122]" />
          </div>
          <div className="text-2xl font-extrabold text-[#295b1e]">
            {round1(myRecoveredKg)} kg
          </div>
          <div className="text-[11px] text-[#6d7f74] font-medium">
            {tr('Certified recycling facility outputs')}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[#dce2d6] bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#697f73]">
            <span>{tr('Segregation Rating')}</span>
            <ShieldCheck size={16} className="text-[#3b6627]" />
          </div>
          <div className="text-2xl font-extrabold text-[#183f32]">
            94%
          </div>
          <div className="text-[11px] text-[#6d7f74] font-medium">
            {tr('Well-sorted clean streams')}
          </div>
        </div>
      </div>
    </div>
  )
}
