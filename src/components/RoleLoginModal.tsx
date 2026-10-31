import React, { useState } from 'react'
import {
  UserRound,
  Truck,
  Factory,
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  ArrowRight,
  Check,
  LockKeyhole,
  RotateCcw,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT, LANG_NAMES } from '../lib/i18n'
import { WARDS, PARTNERS } from '../lib/data'
import type { Role, GeneratorType, Lang } from '../lib/types'

interface RoleLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RoleLoginModal({ isOpen, onClose }: RoleLoginModalProps) {
  const { session, partners } = useApp()
  const { t, lang } = useT()

  const [activeTab, setActiveTab] = useState<Role>(session.role)
  const [userName, setUserName] = useState(session.userName)
  const [userPhone, setUserPhone] = useState(session.userPhone)
  const [userWard, setUserWard] = useState(session.userWard)
  const [userType, setUserType] = useState<GeneratorType>(session.userType)
  const [userAddress, setUserAddress] = useState(session.userAddress)
  const [collectorId, setCollectorId] = useState(session.collectorId)
  const [facilityId, setFacilityId] = useState(session.facilityId)
  const [selectedLang, setSelectedLang] = useState<Lang>(session.lang)

  if (!isOpen) return null

  const collectors = partners.filter((p) => p.kind === 'collector')
  const facilities = partners.filter((p) => p.kind === 'facility')

  function handleSaveLogin() {
    actions.updateSession({
      onboarded: true,
      role: activeTab,
      lang: selectedLang,
      userName,
      userPhone,
      userWard,
      userType,
      userAddress,
      collectorId,
      facilityId,
    })
    onClose()
  }

  function prefillPersona(type: 'citizen' | 'business' | 'collector' | 'recycler' | 'admin') {
    if (type === 'citizen') {
      setActiveTab('generator')
      setUserType('household')
      setUserName('Meera Joshi')
      setUserPhone('98220 41736')
      setUserWard('w2')
      setUserAddress('Flat 4, Sai Krupa Apartments, Station Road')
    } else if (type === 'business') {
      setActiveTab('generator')
      setUserType('business')
      setUserName('Annapurna Hotel')
      setUserPhone('98901 22450')
      setUserWard('w1')
      setUserAddress('Main Bazaar, Near Clock Tower, Old Market')
    } else if (type === 'collector') {
      setActiveTab('collector')
      setCollectorId('c1')
    } else if (type === 'recycler') {
      setActiveTab('processor')
      setFacilityId('f1')
    } else if (type === 'admin') {
      setActiveTab('admin')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
        {/* Header */}
        <div className="border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
                Role Access Portal
              </div>
              <h2 className="font-display text-2xl text-[#183f32] mt-0.5">
                Sign in by Interface
              </h2>
            </div>
            <div className="rounded-xl bg-[#e3ecda] p-2 text-[#46652b]">
              <LockKeyhole size={20} />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="text-[#6d7e74] self-center mr-1 text-[10px] uppercase tracking-wide">
              Quick demo profiles:
            </span>
            <button
              onClick={() => prefillPersona('citizen')}
              className="px-2.5 py-1 rounded-md bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a]"
            >
              Citizen (Meera)
            </button>
            <button
              onClick={() => prefillPersona('business')}
              className="px-2.5 py-1 rounded-md bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a]"
            >
              Business (Hotel)
            </button>
            <button
              onClick={() => prefillPersona('collector')}
              className="px-2.5 py-1 rounded-md bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a]"
            >
              Collector (Ravi)
            </button>
            <button
              onClick={() => prefillPersona('recycler')}
              className="px-2.5 py-1 rounded-md bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a]"
            >
              Recycler (Shakti)
            </button>
          </div>
        </div>

        {/* 3 Main Role Tabs */}
        <div className="grid grid-cols-4 border-b border-[#e2e6dc] bg-[#edf2e6] p-1.5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'generator'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <UserRound size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">1. Citizen / Biz</span>
          </button>

          <button
            onClick={() => setActiveTab('collector')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'collector'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <Truck size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">2. Collector</span>
          </button>

          <button
            onClick={() => setActiveTab('processor')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'processor'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <Factory size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">3. Recycler</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'admin'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <Building2 size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">4. Ward Office</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* TAB 1: Citizen / Business */}
          {activeTab === 'generator' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#edf4e4] p-3 text-xs font-semibold text-[#486333] border border-[#d6e3c8]">
                <strong>Citizen & Business Interface:</strong> Report domestic or commercial waste, schedule doorstep pickups, receive rule-based segregation tips, and trace your batch directly to the recycling plant.
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                  Generator Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'household', label: 'Household' },
                    { id: 'business', label: 'Shop / Restaurant' },
                    { id: 'institution', label: 'Institution / School' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUserType(item.id as GeneratorType)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${
                        userType === item.id
                          ? 'border-[#183f32] bg-[#183f32] text-white'
                          : 'border-[#d0d7cb] bg-white text-[#516358]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    Your Name / Business Name
                  </label>
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cd] bg-white text-xs font-bold text-[#183f32] outline-none focus:border-[#4d722e]"
                    placeholder="e.g. Meera Joshi"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    Mobile Number (for SMS Tracking)
                  </label>
                  <div className="flex h-10 items-center rounded-xl border border-[#d2d9cd] bg-white px-2.5">
                    <span className="text-xs font-bold text-[#718278] mr-2">+91</span>
                    <input
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-[#183f32] outline-none"
                      placeholder="98220 41736"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    Service Ward
                  </label>
                  <select
                    value={userWard}
                    onChange={(e) => setUserWard(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cd] bg-white text-xs font-bold text-[#183f32] outline-none"
                  >
                    {WARDS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.rural ? '(Rural)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    Address / Landmark
                  </label>
                  <input
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cd] bg-white text-xs font-bold text-[#183f32] outline-none"
                    placeholder="Street, flat or building"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Collector */}
          {activeTab === 'collector' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#edf4e4] p-3 text-xs font-semibold text-[#486333] border border-[#d6e3c8]">
                <strong>Collector Interface:</strong> View scheduled pickups, accept nearby jobs based on vehicle capacity, perform doorstep scale weigh-ins with physical contamination check, and dispatch aggregated lots to verified recyclers.
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5246] block mb-2">
                  Select Collector Profile
                </label>
                <div className="space-y-2">
                  {collectors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCollectorId(c.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                        collectorId === c.id
                          ? 'border-[#183f32] bg-[#f0f6eb] ring-2 ring-[#70954b]'
                          : 'border-[#d5ded0] bg-white hover:border-[#b0c0a9]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#183f32] text-[#dff47d] grid place-items-center shrink-0">
                          <Truck size={17} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#183f32]">
                              {c.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-[#476e27] bg-[#e1ebd2] px-1.5 py-0.5 rounded">
                              <ShieldCheck size={11} /> {c.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-[#5a6e63]">
                            {c.org} · Cap: {c.capacity} stops/day
                          </div>
                          <div className="text-[10px] text-[#718479] mt-0.5 font-medium">
                            {c.credential}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border grid place-items-center shrink-0 mt-1 ${
                          collectorId === c.id
                            ? 'bg-[#183f32] border-[#183f32] text-white'
                            : 'border-[#cbd4c5]'
                        }`}
                      >
                        {collectorId === c.id && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Recycler / Composter */}
          {activeTab === 'processor' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#edf4e4] p-3 text-xs font-semibold text-[#486333] border border-[#d6e3c8]">
                <strong>Recycler & Recovery Processing Interface:</strong> Accept incoming lots from collectors, log weighbridge tickets, record verified recovered outputs (e.g. flakes, compost) vs rejected impurities, and ensure strict mass-balance balance.
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5246] block mb-2">
                  Select Recovery Facility Profile
                </label>
                <div className="space-y-2">
                  {facilities.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFacilityId(f.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                        facilityId === f.id
                          ? 'border-[#183f32] bg-[#f0f6eb] ring-2 ring-[#70954b]'
                          : 'border-[#d5ded0] bg-white hover:border-[#b0c0a9]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[#183f32] text-[#dff47d] grid place-items-center shrink-0">
                          <Factory size={17} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#183f32]">
                              {f.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-[#476e27] bg-[#e1ebd2] px-1.5 py-0.5 rounded">
                              <ShieldCheck size={11} /> {f.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-[#5a6e63]">
                            {f.org} · {f.method} · {f.capacity} kg/day
                          </div>
                          <div className="text-[10px] text-[#718479] mt-0.5 font-medium">
                            {f.credential}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border grid place-items-center shrink-0 mt-1 ${
                          facilityId === f.id
                            ? 'bg-[#183f32] border-[#183f32] text-white'
                            : 'border-[#cbd4c5]'
                        }`}
                      >
                        {facilityId === f.id && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Ward Admin */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#edf4e4] p-3 text-xs font-semibold text-[#486333] border border-[#d6e3c8]">
                <strong>Municipal Ward Sanitation Interface:</strong> Real-time oversight over open dumping incidents, fire hazards, unmatched requests, partner verifications, and compliance reporting.
              </div>
              <div className="rounded-xl border border-[#d5ded0] bg-white p-4 space-y-2">
                <div className="text-xs font-bold text-[#183f32]">Ward Authority Mode:</div>
                <div className="text-xs text-[#5e7166]">
                  Allows manual assignment of collector routes for unattended dumping hotspots, verifies credentials of new scrap dealers, and exports the master ledger for SPCB/CPCB audit.
                </div>
              </div>
            </div>
          )}

          {/* Language preference selector inside modal */}
          <div className="pt-2 border-t border-[#e2e6dc] flex items-center justify-between">
            <span className="text-xs font-bold text-[#55695d]">Preferred Language:</span>
            <div className="flex gap-1">
              {(['en', 'hi', 'mr', 'bn'] as Lang[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedLang(c)}
                  className={`px-2 py-1 rounded text-xs font-extrabold ${
                    selectedLang === c
                      ? 'bg-[#183f32] text-white'
                      : 'bg-white border border-[#d2d9cc] text-[#55685d]'
                  }`}
                >
                  {LANG_NAMES[c]?.native}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#62756a] hover:text-[#183f32]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveLogin}
            className="flex items-center gap-2 rounded-xl bg-[#e36338] hover:bg-[#d05329] text-white text-xs font-extrabold px-5 py-2.5 shadow-md"
          >
            Launch Interface <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
