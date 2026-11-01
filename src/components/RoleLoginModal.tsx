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
  Sparkles,
  UserPlus,
  LogIn,
  Languages,
  X,
  Recycle,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT, LANG_NAMES } from '../lib/i18n'
import { BrandLogo } from './BrandLogo'
import { WARDS, PARTNERS } from '../lib/data'
import type { Role, GeneratorType, Lang } from '../lib/types'

interface RoleLoginModalProps {
  isOpen: boolean
  onClose: () => void
  isInitialScreen?: boolean
}

export function RoleLoginModal({ isOpen, onClose, isInitialScreen = false }: RoleLoginModalProps) {
  const { session, partners } = useApp()
  const { tr, lang } = useT()

  const [activeTab, setActiveTab] = useState<Role>(session.role)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Form Fields
  const [userName, setUserName] = useState(session.userName)
  const [userPhone, setUserPhone] = useState(session.userPhone)
  const [userWard, setUserWard] = useState(session.userWard)
  const [userType, setUserType] = useState<GeneratorType>(session.userType)
  const [userAddress, setUserAddress] = useState(session.userAddress)

  // Collector Fields
  const [collectorId, setCollectorId] = useState(session.collectorId)
  const [collectorName, setCollectorName] = useState('Ravi Shinde')
  const [collectorOrg, setCollectorOrg] = useState('Swachh Seva Sahakari Sanstha')
  const [collectorVehicle, setCollectorVehicle] = useState('MH-12-TR-4021 (Electric Auto)')

  // Facility Fields
  const [facilityId, setFacilityId] = useState(session.facilityId)
  const [facilityName, setFacilityName] = useState('Shakti Plastic Recovery')
  const [facilitySpcb, setFacilitySpcb] = useState('MPCB/W-842/2024')
  const [facilityCapacity, setFacilityCapacity] = useState('1500')

  // Ward Officer Fields
  const [officerId, setOfficerId] = useState('WARD-INSP-204')
  const [officerName, setOfficerName] = useState('K. S. Patil (Ward Officer)')
  const [officerPin, setOfficerPin] = useState('')

  if (!isOpen && !isInitialScreen) return null

  const collectors = partners.filter((p) => p.kind === 'collector')
  const facilities = partners.filter((p) => p.kind === 'facility')

  function handleLanguageChange(newLang: Lang) {
    actions.updateSession({ lang: newLang })
  }

  function handleSaveLogin() {
    let finalName = userName
    if (activeTab === 'collector') finalName = collectorName
    else if (activeTab === 'processor') finalName = facilityName
    else if (activeTab === 'admin') finalName = officerName

    actions.updateSession({
      onboarded: true,
      role: activeTab,
      lang,
      userName: finalName,
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
      setCollectorName('Ravi Shinde (Auto 12)')
      setCollectorVehicle('MH-12-TR-4021')
    } else if (type === 'recycler') {
      setActiveTab('processor')
      setFacilityId('f1')
      setFacilityName('Shakti Plastic Recovery Facility')
    } else if (type === 'admin') {
      setActiveTab('admin')
      setOfficerName('K. S. Patil (Sanitation Officer)')
      setUserWard('w2')
      setOfficerPin('4812')
    }
  }

  const containerClasses = isInitialScreen
    ? 'min-h-screen bg-[#f5f6f1] flex flex-col justify-center items-center p-4 sm:p-6 text-[#18392b]'
    : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs'

  const cardClasses = isInitialScreen
    ? 'w-full max-w-2xl flex flex-col rounded-3xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b] my-auto'
    : 'relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]'

  return (
    <div className={containerClasses}>
      {isInitialScreen && (
        <div className="flex justify-center mb-6">
          <BrandLogo size="lg" />
        </div>
      )}

      <div className={cardClasses}>
        {/* Header with Language Selector & Close */}
        <div className="border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
                {tr('Sign in to Avartan')}
              </div>
              <h2 className="font-display text-xl sm:text-2xl text-[#183f32] mt-0.5">
                {tr('Access your circular economy dashboard')}
              </h2>
            </div>

            {/* Language Switcher Toolbar (Issue 2) */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#d2d9cc] shadow-xs">
              <span className="text-[10px] font-extrabold text-[#526a5c] px-1.5 uppercase hidden sm:inline">
                {tr('Preferred Language:')}
              </span>
              {(['en', 'hi', 'mr', 'bn'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => handleLanguageChange(l)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                    lang === l
                      ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                      : 'text-[#486053] hover:bg-[#edf2e6]'
                  }`}
                >
                  {LANG_NAMES[l].native}
                </button>
              ))}
            </div>

            {!isInitialScreen && (
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359] hover:bg-[#e4ebd9]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Preset Persona Buttons */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <span className="text-[#6d7e74] mr-1 text-[10px] uppercase tracking-wide">
              {tr('Quick demo profiles:')}
            </span>
            <button
              type="button"
              onClick={() => prefillPersona('citizen')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a] transition"
            >
              Meera (Citizen)
            </button>
            <button
              type="button"
              onClick={() => prefillPersona('business')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a] transition"
            >
              Hotel Annapurna (Biz)
            </button>
            <button
              type="button"
              onClick={() => prefillPersona('collector')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a] transition"
            >
              Ravi (Collector)
            </button>
            <button
              type="button"
              onClick={() => prefillPersona('recycler')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a] transition"
            >
              Shakti (Recycler)
            </button>
            <button
              type="button"
              onClick={() => prefillPersona('admin')}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d2d9cc] hover:bg-[#e9f1e1] text-[#2c473a] transition"
            >
              Patil (Ward 2 Officer)
            </button>
          </div>
        </div>

        {/* 4 Role Tabs (Issue 10) */}
        <div className="grid grid-cols-4 border-b border-[#e2e6dc] bg-[#edf2e6] p-1.5 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'generator'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <UserRound size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">{tr('1. Citizen / Biz')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collector')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'collector'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <Truck size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">{tr('2. Collector')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('processor')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'processor'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <Factory size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">{tr('3. Recycler')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'admin'
                ? 'bg-white text-[#183f32] shadow-xs'
                : 'text-[#586b60] hover:bg-white/60'
            }`}
          >
            <Building2 size={17} className="mb-0.5" />
            <span className="text-[11px] leading-tight">{tr('4. Ward Office')}</span>
          </button>
        </div>

        {/* Auth Mode Toggle: Sign In vs Sign Up */}
        <div className="flex border-b border-[#e5e9df] bg-white px-5 py-2.5 items-center justify-between">
          <div className="flex rounded-xl bg-[#eef3e8] p-1 border border-[#d5ded0]">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                authMode === 'signin'
                  ? 'bg-[#183f32] text-white shadow-xs'
                  : 'text-[#4e6456] hover:text-[#183f32]'
              }`}
            >
              <LogIn size={13} /> {tr('Sign In')}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold transition ${
                authMode === 'signup'
                  ? 'bg-[#183f32] text-white shadow-xs'
                  : 'text-[#4e6456] hover:text-[#183f32]'
              }`}
            >
              <UserPlus size={13} /> {tr('Sign Up / Register')}
            </button>
          </div>

          <span className="text-[11px] font-semibold text-[#667a6e]">
            {authMode === 'signin' ? tr('Registered Profile Access') : tr('New Profile Registration')}
          </span>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* PROFILE 1: Citizen / Business */}
          {activeTab === 'generator' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#edf4e4] p-3 text-xs font-semibold text-[#486333] border border-[#d6e3c8]">
                <strong>{tr('Citizen Portal')}: </strong>
                {tr('Schedule a Doorstep Pickup')}, {tr('Basic Segregation Guide')}, {tr('Trace Material')}.
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                  {tr('Generator Category')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'household', label: tr('Household') },
                    { id: 'business', label: tr('Commercial / Shop') },
                    { id: 'institution', label: tr('School / Institution') },
                  ].map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => setUserType(gt.id as GeneratorType)}
                      className={`py-2 px-2 rounded-xl border text-center text-xs font-extrabold transition ${
                        userType === gt.id
                          ? 'border-[#183f32] bg-[#f0f6eb] text-[#183f32] ring-2 ring-[#70954b]'
                          : 'border-[#d5ded0] bg-white text-[#55695d] hover:bg-[#f6f9f2]'
                      }`}
                    >
                      {gt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    {userType === 'business' ? tr('Shop or Business Name') : tr('Full Name')}
                  </label>
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Meera Joshi"
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    {tr('Phone Number')}
                  </label>
                  <input
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="e.g. 98220 41736"
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    {tr('Municipal Ward')}
                  </label>
                  <select
                    value={userWard}
                    onChange={(e) => setUserWard(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                  >
                    {WARDS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    {tr('House / Building / Street Address')}
                  </label>
                  <input
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    placeholder="e.g. Flat 4, Sai Krupa Apartments, Station Road"
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROFILE 2: Doorstep Collector */}
          {activeTab === 'collector' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#eaf4f5] p-3 text-xs font-semibold text-[#255b63] border border-[#d0e5e8]">
                <strong>{tr('Collector Portal')}: </strong>
                {tr('Daily Route & Stops')}, {tr('Doorstep Weigh-in')}, {tr('Vehicle Load & Dispatch')}.
              </div>

              {authMode === 'signup' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                        {tr('Full Name')}
                      </label>
                      <input
                        value={collectorName}
                        onChange={(e) => setCollectorName(e.target.value)}
                        placeholder="e.g. Ravi Shinde"
                        className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                        {tr('Vehicle Registration No.')}
                      </label>
                      <input
                        value={collectorVehicle}
                        onChange={(e) => setCollectorVehicle(e.target.value)}
                        placeholder="MH-12-TR-4021"
                        className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                      {tr('Cooperative or Organization')}
                    </label>
                    <input
                      value={collectorOrg}
                      onChange={(e) => setCollectorOrg(e.target.value)}
                      placeholder="e.g. Swachh Seva Sanstha"
                      className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-2">
                    {tr('Select Doorstep Collector Profile')}
                  </label>
                  <div className="space-y-2">
                    {collectors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCollectorId(c.id)
                          setCollectorName(c.name)
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                          collectorId === c.id
                            ? 'border-[#183f32] bg-[#f0f6eb] ring-2 ring-[#70954b]'
                            : 'border-[#d5ded0] bg-white hover:border-[#b0c0a9]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                              {c.org} · Base: {c.baseWard.toUpperCase()} · {c.capacity} stops/day
                            </div>
                          </div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border grid place-items-center shrink-0 ${
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
              )}
            </div>
          )}

          {/* PROFILE 3: Recycler / Composter */}
          {activeTab === 'processor' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#faf0e3] p-3 text-xs font-semibold text-[#74451c] border border-[#f0dac0]">
                <strong>{tr('Recycler / Facility')}: </strong>
                {tr('Inbound Manifests')}, {tr('Facility Intake')}, {tr('Mass Balance Ledger')}.
              </div>

              {authMode === 'signup' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                        {tr('Facility Name')}
                      </label>
                      <input
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        placeholder="e.g. EcoGreen Composting"
                        className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                        {tr('SPCB / CPCB Authorization License')}
                      </label>
                      <input
                        value={facilitySpcb}
                        onChange={(e) => setFacilitySpcb(e.target.value)}
                        placeholder="SPCB/REC/2024/918"
                        className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                      {tr('Daily Processing Capacity (kg/day)')}
                    </label>
                    <input
                      value={facilityCapacity}
                      onChange={(e) => setFacilityCapacity(e.target.value)}
                      placeholder="2000"
                      className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-2">
                    {tr('Select Recovery Facility Profile')}
                  </label>
                  <div className="space-y-2">
                    {facilities.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFacilityId(f.id)
                          setFacilityName(f.name)
                        }}
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
              )}
            </div>
          )}

          {/* PROFILE 4: Ward Sanitation Officer */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#eeeaf7] p-3 text-xs font-semibold text-[#4f3b7b] border border-[#dcd3ee]">
                <strong>{tr('Ward Sanitation Office')}: </strong>
                {tr('Ward Overview')}, {tr('Dumping Alerts & Hotspots')}, {tr('Partner Verifications')}.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    {tr('Municipal Officer ID')}
                  </label>
                  <input
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="e.g. WARD-INSP-204"
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                    {tr('Sanitation Zone / Ward')}
                  </label>
                  <select
                    value={userWard}
                    onChange={(e) => setUserWard(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                  >
                    {WARDS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5246] block mb-1">
                  {tr('Authorization PIN')}
                </label>
                <input
                  type="password"
                  value={officerPin}
                  onChange={(e) => setOfficerPin(e.target.value)}
                  placeholder="Enter 4-digit passkey (e.g. 4812)"
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white font-mono text-xs font-bold text-[#183f32] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3.5 flex items-center justify-between">
          {!isInitialScreen ? (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-[#62756a] hover:text-[#183f32]"
            >
              {tr('Cancel')}
            </button>
          ) : (
            <div className="text-[11px] font-semibold text-[#667a6e]">
              {tr('Avartan v4.0 · Verified SPCB Open Ledger')}
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveLogin}
            className="flex items-center gap-2 rounded-xl bg-[#e36338] hover:bg-[#d05329] text-white text-xs font-extrabold px-5 py-2.5 shadow-md transition"
          >
            <span>{authMode === 'signin' ? tr('Launch Interface') : tr('Complete Registration')}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
