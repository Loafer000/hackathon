import React from 'react'
import {
  X,
  Scale,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Languages,
} from 'lucide-react'
import { UNIT_KG, CATEGORIES, FACTORS, HEAP_KG } from '../lib/data'
import { useT, LANG_NAMES } from '../lib/i18n'
import { actions } from '../lib/store'
import type { CategoryId, Lang } from '../lib/types'

interface MethodologyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
  const { tr, lang } = useT()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
        {/* Header with Issue 5: Language Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#183f32] text-[#dff47d] shadow-sm shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#527031]">
                {tr('Methodology & Transparency')}
              </div>
              <h2 className="font-display text-xl text-[#183f32]">
                {tr('Assumptions, Standards & Mass Balance')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Issue 5: Language Selection Toolbar inside Methodology/Assumptions */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d2d9cc] shadow-xs">
              {(['en', 'hi', 'mr', 'bn'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => actions.updateSession({ lang: l })}
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

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359] hover:bg-[#e6ebe0]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs">
          {/* Core Rule 1: Mass Balance & Double-Counting Guard */}
          <div className="rounded-2xl border border-[#cfe0c4] bg-[#f2f8eb] p-4 space-y-2">
            <div className="flex items-center gap-2 font-extrabold text-sm text-[#254d1a]">
              <ShieldCheck size={18} className="text-[#497330]" /> {tr('Strict Zero Double-Counting Guarantee')}
            </div>
            <p className="text-[#3c562e] leading-relaxed">
              {tr('In conventional systems, waste is counted multiple times: once by the citizen, again by the collector, and once more at the factory.')} <strong>{tr('Avartan enforces a closed mass balance equation:')}</strong>
            </p>
            <div className="font-mono text-xs bg-white p-3 rounded-xl border border-[#d1dec7] text-[#1c402b] space-y-1">
              <div>1. <strong>Estimated Quantity</strong> (citizen report) = Used solely for route planning. Never added to official totals.</div>
              <div>2. <strong>Collected Quantity</strong> = Calibrated digital scale reading at doorstep, certified by collector.</div>
              <div>3. <strong>Facility Mass Balance</strong>: Received Weight = Recovered Material + Rejected Contaminants + Process Loss.</div>
              <div>4. <strong>Recycled & Composted</strong> are subsets of Recovered — never added twice.</div>
            </div>
          </div>

          {/* Unit Weight Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm text-[#183f32]">
                {tr('1. Transparent Unit-Weight Planning Table (kg per unit)')}
              </h3>
              <span className="text-[10px] font-bold text-[#62776c]">Based on field weigh-in pilot data</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#dce2d7] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f0f4ea] text-[10px] font-extrabold uppercase text-[#546b5e] border-b border-[#dce2d7]">
                  <tr>
                    <th className="py-2.5 px-3">{tr('Category')}</th>
                    <th className="py-2.5 px-3">{tr('Small bag')}</th>
                    <th className="py-2.5 px-3">{tr('10L Bucket')}</th>
                    <th className="py-2.5 px-3">{tr('Sack')}</th>
                    <th className="py-2.5 px-3">{tr('Items / pieces')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7eae4] font-semibold text-[#30483c]">
                  {CATEGORIES.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#f9faf7]">
                      <td className="py-2 px-3 font-bold flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name[lang] || cat.name.en}
                      </td>
                      <td className="py-2 px-3">{UNIT_KG[cat.id]?.smallbag} kg</td>
                      <td className="py-2 px-3">{UNIT_KG[cat.id]?.bucket} kg</td>
                      <td className="py-2 px-3">{UNIT_KG[cat.id]?.sack} kg</td>
                      <td className="py-2 px-3">{UNIT_KG[cat.id]?.items} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[10px] text-[#6d7e74] italic">
              * Citizens can also enter custom scale readings directly. Unverified estimates are flagged with a dotted tag.
            </p>
          </div>

          {/* Carbon Avoidance Factors (EPA WARM & IPCC) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm text-[#183f32]">
                {tr('2. Climate Mitigation Impact Factors')}
              </h3>
              <span className="text-[10px] font-bold text-[#62776c]">kg CO₂e avoided per kg recovered</span>
            </div>
            <div className="rounded-xl border border-[#dce2d7] bg-white p-4 space-y-3">
              <p className="text-[#455c50] leading-relaxed">
                Emissions avoided are calculated <strong>only on certified recovered material</strong>, using conservative published lifecycle metrics (US EPA Waste Reduction Model / IPCC Guidelines Vol. 5).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const factor = FACTORS[c.id]
                  return (
                    <div key={c.id} className="p-2.5 rounded-lg border border-[#e1e6dc] bg-[#fafbf8]">
                      <div className="font-bold text-[#183f32] text-xs truncate">
                        {c.name[lang] || c.name.en}
                      </div>
                      <div className="text-sm font-extrabold text-[#3a6823] mt-1">
                        {factor ? `${factor.mid} kg CO₂e` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-[#6d7f74]">
                        {factor ? `Range: ${factor.low}–${factor.high}` : 'Not estimated (variable)'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Prebuilt Segregation Detection & Human-in-the-Loop Rules */}
          <div className="rounded-2xl border border-[#e6d8b5] bg-[#fffaf0] p-4 space-y-2">
            <div className="flex items-center gap-2 font-extrabold text-sm text-[#7a5518]">
              <AlertTriangle size={18} className="text-[#a4701d]" /> {tr('3. Visual & Rule-Based Helper Boundaries')}
            </div>
            <p className="text-[#6d5124] leading-relaxed">
              1. <strong>Classification is NEVER claimed as 100% accurate:</strong> Prebuilt client-side color heuristics and keyword matching offer planning suggestions only (confidence deliberately capped at 60%).<br />
              2. <strong>Mandatory Human Cross-Check:</strong> The collector physically inspects each stream at the doorstep. The collector's certified scale entry is the source of truth.<br />
              3. <strong>Gemini Vision API:</strong> In future updates, multimodal Gemini models will assist the user with advanced image recognition, while maintaining the human manual verification step.
            </p>
          </div>

          {/* Matching Algorithm Weights */}
          <div>
            <h3 className="font-extrabold text-sm text-[#183f32] mb-2">
              {tr('4. Transparent Collector-Recycler Matching Weights')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl border border-[#dce2d7] bg-white">
                <div className="text-xl font-extrabold text-[#183f32]">40%</div>
                <div className="text-[10px] font-bold text-[#62776c] uppercase mt-1">{tr('Category Coverage')}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#dce2d7] bg-white">
                <div className="text-xl font-extrabold text-[#183f32]">25%</div>
                <div className="text-[10px] font-bold text-[#62776c] uppercase mt-1">{tr('Geographic Proximity')}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#dce2d7] bg-white">
                <div className="text-xl font-extrabold text-[#183f32]">20%</div>
                <div className="text-[10px] font-bold text-[#62776c] uppercase mt-1">{tr('Reliability Score')}</div>
              </div>
              <div className="p-3 rounded-xl border border-[#dce2d7] bg-white">
                <div className="text-xl font-extrabold text-[#183f32]">15%</div>
                <div className="text-[10px] font-bold text-[#62776c] uppercase mt-1">{tr('Free Daily Load')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#5a6c62]">
            {tr('Auditable under CPCB / SPCB Circular Economy Guidelines')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#183f32] px-4 py-1.5 text-xs font-extrabold text-[#dff47d]"
          >
            {tr('Close')}
          </button>
        </div>
      </div>
    </div>
  )
}
