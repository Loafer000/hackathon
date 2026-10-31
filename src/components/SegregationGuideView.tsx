import React, { useState } from 'react'
import {
  Recycle,
  Mic,
  Sprout,
  PackageCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { CATEGORIES, STREAMS } from '../lib/data'
import { useT } from '../lib/i18n'
import type { CategoryId, Stream } from '../lib/types'

interface SegregationGuideViewProps {
  onOpenVoiceCategory: (cat: CategoryId) => void
}

export function SegregationGuideView({ onOpenVoiceCategory }: SegregationGuideViewProps) {
  const { lang } = useT()
  const [selectedStream, setSelectedStream] = useState<CategoryId>('organic')

  const currentCategory = CATEGORIES.find((c) => c.id === selectedStream)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e6db] pb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
            Source Segregation Manual
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#183f32] mt-0.5">
            Basic Segregation & Prep Guide
          </h1>
          <p className="text-xs font-semibold text-[#64796e] mt-1">
            Proper sorting at source prevents 90% of landfill contamination and guarantees material recovery.
          </p>
        </div>

        <button
          onClick={() => onOpenVoiceCategory(selectedStream)}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-xs"
        >
          <Mic size={16} />
          <span>Listen in Local Language</span>
        </button>
      </div>

      {/* 4 Colored Stream Containers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['wet', 'dry', 'special', 'sanitary'] as Stream[]).map((st) => {
          const info = STREAMS[st]
          return (
            <div
              key={st}
              className="p-4 rounded-2xl border border-[#dce2d6] bg-white shadow-xs space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: info.color }} />
                <span className="text-xs font-extrabold text-[#183f32] uppercase">
                  {info.name[lang] || info.name.en} Stream
                </span>
              </div>
              <div className="text-sm font-extrabold text-[#294537]">
                {info.bin[lang] || info.bin.en}
              </div>
            </div>
          )
        })}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pt-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedStream === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedStream(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-2 ${
                isSelected
                  ? 'border-[#183f32] bg-[#183f32] text-white shadow-xs'
                  : 'border-[#dce2d7] bg-white text-[#455c50] hover:bg-[#edf2e7]'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span>{cat.name[lang] || cat.name.en}</span>
            </button>
          )
        })}
      </div>

      {/* Detailed Card for Selected Category */}
      <div className="rounded-2xl border border-[#dce2d6] bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e2e7dc] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: currentCategory.color }}
              />
              <h2 className="font-display text-2xl text-[#183f32]">
                {currentCategory.name[lang] || currentCategory.name.en}
              </h2>
            </div>
            <p className="text-xs text-[#52695c] font-semibold mt-1">
              Stream: <strong className="uppercase">{currentCategory.stream}</strong> · Examples: {currentCategory.examples[lang] || currentCategory.examples.en}
            </p>
          </div>

          <button
            onClick={() => onOpenVoiceCategory(currentCategory.id)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#d0d8cb] bg-[#fafbf8] text-xs font-extrabold text-[#2c4839] hover:bg-[#ebf2e4]"
          >
            <Mic size={15} />
            <span>Voice Instructions</span>
          </button>
        </div>

        {/* Step-by-Step Preparation Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prep Guidelines */}
          <div className="p-4 rounded-xl border border-[#d8e3ce] bg-[#f2f7ec] space-y-2 text-xs">
            <div className="font-extrabold text-sm text-[#274f1d] flex items-center gap-1.5">
              <CheckCircle2 size={16} /> How to Prepare for Doorstep Pickup
            </div>
            <p className="text-[#3b592e] font-semibold leading-relaxed">
              {currentCategory.prep[lang] || currentCategory.prep.en}
            </p>
          </div>

          {/* Golden Rules */}
          <div className="p-4 rounded-xl border border-[#eedab2] bg-[#fffaf0] space-y-2 text-xs">
            <div className="font-extrabold text-sm text-[#7a541c] flex items-center gap-1.5">
              <AlertTriangle size={16} /> Contamination Warnings
            </div>
            <p className="text-[#6d5124] font-semibold leading-relaxed">
              Never mix with general garbage or plastic carry bags. Contaminated bags are downgraded during collector inspection and cannot be certified for full recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
