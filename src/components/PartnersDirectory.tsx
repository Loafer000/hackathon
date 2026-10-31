import React, { useState } from 'react'
import {
  ShieldCheck,
  Truck,
  Factory,
  MapPin,
  Scale,
  Phone,
  Search,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT } from '../lib/i18n'
import { CATEGORIES, WARDS } from '../lib/data'
import type { Partner, CategoryId, VerifyStatus } from '../lib/types'

export function PartnersDirectory() {
  const { partners, session } = useApp()
  const { lang } = useT()

  const [filterKind, setFilterKind] = useState<'all' | 'collector' | 'facility'>('all')
  const [filterCategory, setFilterCategory] = useState<CategoryId | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = partners.filter((p) => {
    if (filterKind !== 'all' && p.kind !== filterKind) return false
    if (filterCategory !== 'all' && !p.categories.includes(filterCategory)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.org.toLowerCase().includes(q) ||
        p.credential.toLowerCase().includes(q)
      )
    }
    return true
  })

  function togglePartnerStatus(p: Partner) {
    const nextStatus: VerifyStatus = p.status === 'verified' ? 'suspended' : 'verified'
    actions.setPartnerStatus(p.id, nextStatus)
  }

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e6db] pb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
            Certified Circular Network
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#183f32] mt-0.5">
            Verified Collectors & Recyclers
          </h1>
          <p className="text-xs font-semibold text-[#64796e] mt-1">
            All partners hold audited SPCB authorizations, ULB IDs, or NRLM cooperative registrations.
          </p>
        </div>

        {/* Filter by Type */}
        <div className="flex rounded-xl bg-[#eaf0e2] p-1 border border-[#d2d9cc]">
          {[
            { id: 'all', label: 'All Partners' },
            { id: 'collector', label: 'Collectors' },
            { id: 'facility', label: 'Recyclers / Composting' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterKind(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                filterKind === item.id
                  ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                  : 'text-[#486053] hover:text-[#183f32]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Stream Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-[#708477]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by partner name, cooperative, or license ID..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
          />
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
          >
            <option value="all">All Waste Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang] || c.name.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Partners Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((partner) => {
          const isCollector = partner.kind === 'collector'
          const isVerified = partner.status === 'verified'
          return (
            <div
              key={partner.id}
              className="p-5 rounded-2xl border border-[#dce2d6] bg-white shadow-xs space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${
                      isCollector ? 'bg-[#183f32] text-[#dff47d]' : 'bg-[#e36338] text-white'
                    }`}
                  >
                    {isCollector ? <Truck size={20} /> : <Factory size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#183f32]">
                        {partner.name}
                      </h3>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          isVerified
                            ? 'bg-[#e1ebd2] text-[#3e6623]'
                            : 'bg-[#fff0eb] text-[#b3452b]'
                        }`}
                      >
                        <ShieldCheck size={11} /> {partner.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#506659] mt-0.5">
                      {partner.org} · Base: {partner.baseWard.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#687d72]">
                    Capacity
                  </div>
                  <div className="text-xs font-extrabold text-[#183f32]">
                    {isCollector ? `${partner.capacity} stops/day` : `${partner.capacity} kg/day`}
                  </div>
                </div>
              </div>

              {/* License & Credential Badge */}
              <div className="p-2.5 rounded-xl bg-[#f4f7f0] border border-[#dbe4d4] text-[11px] font-medium text-[#41594b] flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-[#233d2f]">Credential: </span>
                  {partner.credential}
                </div>
                <span className="text-[10px] text-[#63776d] font-bold">
                  {isCollector ? 'Doorstep Pickups' : partner.method}
                </span>
              </div>

              {/* Categories Covered */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#687d72] mr-1">
                  Accepts:
                </span>
                {partner.categories.map((catId) => {
                  const cat = CATEGORIES.find((c) => c.id === catId)
                  return (
                    <span
                      key={catId}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#d6dfcf] bg-[#f9faf7] text-[#344d40]"
                    >
                      {cat?.name[lang] || cat?.name.en || catId}
                    </span>
                  )
                })}
              </div>

              {/* Scrap buy rates for recyclers */}
              {partner.rates && Object.keys(partner.rates).length > 0 && (
                <div className="text-[11px] text-[#55695d] font-semibold flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#697d72]">
                    Scrap Buy Rates:
                  </span>
                  {Object.entries(partner.rates).map(([c, r]) => (
                    <span key={c} className="text-[#325a22] font-extrabold">
                      {c}: ₹{r}/kg
                    </span>
                  ))}
                </div>
              )}

              {/* Action row (Phone & Admin Verify Toggle) */}
              <div className="pt-2 border-t border-[#e2e6dc] flex items-center justify-between">
                <a
                  href={`tel:${partner.phone}`}
                  className="text-xs font-bold text-[#355243] flex items-center gap-1 hover:underline"
                >
                  <Phone size={13} /> {partner.phone}
                </a>

                {session.role === 'admin' && (
                  <button
                    onClick={() => togglePartnerStatus(partner)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition ${
                      isVerified
                        ? 'border-[#e0c3b8] text-[#9c361e] hover:bg-[#fff0eb]'
                        : 'border-[#c6d7bb] text-[#385e23] hover:bg-[#ebf4e4]'
                    }`}
                  >
                    {isVerified ? 'Suspend Partner' : 'Verify Credentials'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
