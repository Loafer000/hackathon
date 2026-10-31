import React, { useState } from 'react'
import {
  Camera,
  Search,
  Scale,
  CalendarDays,
  Clock3,
  MapPin,
  Check,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Upload,
  RefreshCw,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT, LANG_NAMES } from '../lib/i18n'
import { CATEGORIES, WARDS, SLOT_WINDOWS, SLOT_LABEL, matchRules, UNIT_KG } from '../lib/data'
import { rankCollectors } from '../lib/match'
import { analysePhoto } from '../lib/photoHint'
import { round1, addDays, todayIso } from '../lib/format'
import type { CategoryId, UnitId, HeapSize, NewItem, RequestKind, HelperTrace } from '../lib/types'

interface ReportWasteViewProps {
  onSuccess: (requestId: string) => void
  onCancel: () => void
}

export function ReportWasteView({ onSuccess, onCancel }: ReportWasteViewProps) {
  const { session } = useApp()
  const state = useApp()
  const { t, lang } = useT()

  // Mode: pickup vs dumping
  const [reportKind, setReportKind] = useState<RequestKind>('pickup')

  // Step state
  const [step, setStep] = useState<number>(1)

  // Pickup line items
  const [items, setItems] = useState<NewItem[]>([
    { category: 'plastic', qty: 2, unit: 'smallbag' },
  ])

  // Category Helper state
  const [searchQuery, setSearchQuery] = useState('')
  const [helperTrace, setHelperTrace] = useState<HelperTrace | undefined>(undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [manualCorrected, setManualCorrected] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryId>('plastic')

  // Schedule & Address
  const [selectedDate, setSelectedDate] = useState(addDays(todayIso(), 1))
  const [selectedWindow, setSelectedWindow] = useState<typeof SLOT_WINDOWS[number]>('09-11')
  const [reporterName, setReporterName] = useState(session.userName)
  const [reporterPhone, setReporterPhone] = useState(session.userPhone)
  const [ward, setWard] = useState(session.userWard)
  const [address, setAddress] = useState(session.userAddress)
  const [note, setNote] = useState('')

  // Dumping specific fields
  const [heapSize, setHeapSize] = useState<HeapSize>('medium')
  const [isBurning, setIsBurning] = useState(false)
  const [landmark, setLandmark] = useState('')

  // Quick prebuilt sample photos
  const SAMPLE_ITEMS = [
    { label: 'Milk pouch & PET bottles', category: 'plastic' as CategoryId },
    { label: 'Cardboard carton & raddi', category: 'paper' as CategoryId },
    { label: 'Cooked food scraps & peels', category: 'organic' as CategoryId },
    { label: 'Beer & pickle glass jars', category: 'glass' as CategoryId },
    { label: 'Cold drink cans & foil', category: 'metal' as CategoryId },
    { label: 'Old smartphone & charger', category: 'ewaste' as CategoryId },
    { label: 'Old batteries & CFL bulb', category: 'hazardous' as CategoryId },
    { label: 'Used diapers & pads', category: 'sanitary' as CategoryId },
  ]

  // Rule search matches
  const ruleMatches = searchQuery.length >= 2 ? matchRules(searchQuery) : []

  // Current item being configured
  const [itemQty, setItemQty] = useState(2)
  const [itemUnit, setItemUnit] = useState<UnitId>('smallbag')

  // Calculate live planning weight
  const totalEstKg = round1(
    items.reduce((acc, it) => acc + it.qty * UNIT_KG[it.category][it.unit], 0)
  )

  // Rank matching collectors for preview
  const previewReq = {
    id: 'TEMP',
    kind: reportKind,
    createdAt: Date.now(),
    lang,
    reporter: { name: reporterName, phone: reporterPhone, type: session.userType },
    ward,
    address,
    items: items.map((it, idx) => ({
      id: `temp-${idx}`,
      category: it.category,
      qty: it.qty,
      unit: it.unit,
      estKg: it.qty * UNIT_KG[it.category][it.unit],
    })),
    estKg: totalEstKg,
    slot: { date: selectedDate, window: selectedWindow },
    status: 'open' as const,
    declined: [],
    events: [],
  }
  const collectorMatches = rankCollectors(state, previewReq)
  const topCollector = collectorMatches.find((m) => m.eligible)

  function handleAddItem() {
    const newItem: NewItem = {
      category: activeCategory,
      qty: itemQty,
      unit: itemUnit,
      helper: helperTrace,
    }
    setItems([...items, newItem])
    // Reset helper
    setSearchQuery('')
    setPhotoPreview(null)
    setHelperTrace(undefined)
    setManualCorrected(false)
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsAnalysing(true)
    try {
      const { dataUrl, suggestions } = await analysePhoto(file)
      setPhotoPreview(dataUrl)
      if (suggestions.length > 0) {
        const top = suggestions[0]
        setActiveCategory(top.category)
        setHelperTrace({
          source: 'photo',
          suggested: top.category,
          confidence: round1(top.confidence),
        })
      }
    } catch {
      // fallback
    } finally {
      setIsAnalysing(false)
    }
  }

  function handleSelectPrebuiltSample(sample: typeof SAMPLE_ITEMS[number]) {
    setActiveCategory(sample.category)
    setHelperTrace({
      source: 'search',
      suggested: sample.category,
      confidence: 0.55,
    })
    setSearchQuery(sample.label)
  }

  function handleSubmit() {
    const reqId = actions.createRequest({
      kind: reportKind,
      lang,
      reporter: {
        name: reporterName || 'Resident',
        phone: reporterPhone,
        type: session.userType,
      },
      ward,
      address: address || landmark || 'Local Ward Area',
      landmark,
      items: reportKind === 'pickup' ? items : [
        { category: 'plastic', qty: 1, unit: 'kg' },
        { category: 'organic', qty: 1, unit: 'kg' },
      ],
      heap: reportKind === 'dumping' ? heapSize : undefined,
      burning: isBurning,
      photo: photoPreview || undefined,
      note,
      slot: {
        date: selectedDate,
        window: selectedWindow,
      },
    })

    onSuccess(reqId)
  }

  const categoryDetails = CATEGORIES.find((c) => c.id === activeCategory)!

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e6db] pb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567534]">
            Traceable Waste Reporting Flow
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#183f32] mt-0.5">
            {reportKind === 'pickup' ? 'Schedule a Doorstep Pickup' : 'Report Illegal Dumping'}
          </h1>
          <p className="text-xs font-semibold text-[#667a6e] mt-1">
            {reportKind === 'pickup'
              ? 'Sort waste at source, get matched with verified collectors, and receive SMS confirmation.'
              : 'Report unmanaged open dumping or burning for urgent municipal cleanup within 48h.'}
          </p>
        </div>

        {/* Toggle Report Type */}
        <div className="flex rounded-xl bg-[#eaf0e2] p-1 border border-[#d2d9cc]">
          <button
            onClick={() => setReportKind('pickup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              reportKind === 'pickup'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:text-[#183f32]'
            }`}
          >
            Doorstep Pickup
          </button>
          <button
            onClick={() => setReportKind('dumping')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              reportKind === 'dumping'
                ? 'bg-[#ba3d20] text-white shadow-xs'
                : 'text-[#486053] hover:text-[#183f32]'
            }`}
          >
            Open Dumping
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      {reportKind === 'pickup' && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { n: 1, title: '1. What Waste' },
            { n: 2, title: '2. When & Where' },
            { n: 3, title: '3. Match Preview' },
            { n: 4, title: '4. Confirmation' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => {
                if (items.length > 0 || s.n === 1) setStep(s.n)
              }}
              className={`text-left p-2 rounded-xl border transition ${
                step === s.n
                  ? 'border-[#183f32] bg-[#f0f6eb] ring-1 ring-[#73994c]'
                  : step > s.n
                  ? 'border-[#cfe0c5] bg-[#fafbf7] text-[#4f6e30]'
                  : 'border-[#dfe4db] bg-white text-[#839389]'
              }`}
            >
              <div className="text-[10px] font-extrabold">{s.title}</div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: WHAT WASTE (Categorisation & Helper) */}
      {step === 1 && reportKind === 'pickup' && (
        <div className="space-y-6">
          {/* Category Helper Card */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#183f32] flex items-center gap-2">
                  <Sparkles size={17} className="text-[#648737]" />
                  Waste Category Helper & Detection
                </h2>
                <p className="text-xs text-[#62776c] font-medium mt-0.5">
                  Search by name, upload a photo, or tap any category. Human verification is always performed at your door.
                </p>
              </div>
            </div>

            {/* Crucial Human Cross-Check Disclaimer */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#e8d7ae] bg-[#fffaf0] text-xs font-semibold text-[#73511f]">
              <AlertTriangle size={18} className="shrink-0 text-[#a06b1b] mt-0.5" />
              <div>
                <span className="font-extrabold">Human Cross-Check & Verification Policy:</span> Image and rule-based suggestions are planning estimates only and are <em>never</em> claimed as 100% correct. You can freely change the category below. The collector will physically inspect and certify the bags with a digital scale before any recovery record is generated. (Gemini Vision API integration ready for next release).
              </div>
            </div>

            {/* Keyword Rule Search Bar */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#3a5245]">
                Search an item (English, Hindi, Bengali, Hinglish):
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[#708477]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., milk pouch, doodh packet, chai patti, cardboard, CFL, medicine"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#d2d9cc] bg-[#f9faf7] text-xs font-bold text-[#183f32] outline-none focus:border-[#4d722e]"
                />
              </div>

              {/* Keyword Rule Suggestions */}
              {ruleMatches.length > 0 && (
                <div className="p-3 rounded-xl bg-[#edf5e3] border border-[#d4e3c5] space-y-2">
                  <div className="text-[11px] font-extrabold text-[#3b592b]">
                    Matched Rule Suggestions:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ruleMatches.map((m) => {
                      const cat = CATEGORIES.find((c) => c.id === m.category)!
                      return (
                        <button
                          key={m.category}
                          onClick={() => {
                            setActiveCategory(m.category)
                            setHelperTrace({
                              source: 'search',
                              suggested: m.category,
                              confidence: 0.85,
                            })
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition flex items-center gap-1.5 ${
                            activeCategory === m.category
                              ? 'bg-[#183f32] text-white border-[#183f32]'
                              : 'bg-white border-[#c9d7be] text-[#3c592a] hover:bg-[#e4eed7]'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span>{cat.name[lang] || cat.name.en}</span>
                          <span className="text-[10px] opacity-70">({m.keyword})</span>
                        </button>
                      )
                    })}
                  </div>
                  {ruleMatches[0].tip && (
                    <div className="text-[11px] text-[#4f6b36] italic">
                      Tip: {ruleMatches[0].tip[lang] || ruleMatches[0].tip.en}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Photo / Sample Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Photo Input */}
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#ccd6c5] bg-[#f7f9f4] hover:bg-[#edf3e6] cursor-pointer transition text-center">
                {photoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={photoPreview}
                      alt="Uploaded waste"
                      className="h-28 w-36 object-cover rounded-lg mx-auto shadow-xs"
                    />
                    <div className="text-[11px] font-bold text-[#45682d] flex items-center justify-center gap-1">
                      <RefreshCw size={12} /> Replace photo
                    </div>
                  </div>
                ) : (
                  <div>
                    <Camera size={24} className="mx-auto text-[#627a6c] mb-1.5" />
                    <div className="text-xs font-extrabold text-[#183f32]">
                      Upload photo for prebuilt visual hint
                    </div>
                    <div className="text-[10px] text-[#718579] mt-0.5">
                      Analyzes color & brightness in browser
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Prebuilt Samples */}
              <div className="p-3 rounded-xl border border-[#dce2d7] bg-[#f9faf7]">
                <div className="text-[11px] font-extrabold text-[#475d50] mb-2">
                  Or select test waste sample:
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                  {SAMPLE_ITEMS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectPrebuiltSample(item)}
                      className={`px-2 py-1.5 text-left text-[11px] font-bold rounded-lg border truncate transition ${
                        activeCategory === item.category && searchQuery === item.label
                          ? 'border-[#183f32] bg-[#183f32] text-white'
                          : 'border-[#d7dfd2] bg-white text-[#41594b] hover:bg-[#edf2e7]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Helper Result & Manual Correction Grid */}
            <div className="pt-2 border-t border-[#e2e6dc] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#30483c]">
                  Active Waste Stream:
                </span>
                {helperTrace && (
                  <span className="text-[11px] font-bold text-[#49692c] bg-[#e4eed9] px-2 py-0.5 rounded-md">
                    Suggested by {helperTrace.source === 'photo' ? 'Photo Analysis' : 'Keyword Match'} (Confidence: {helperTrace.confidence ? `${Math.round(helperTrace.confidence * 100)}%` : 'Rule'})
                  </span>
                )}
              </div>

              {/* 8 Categories with explicit Manual Correction */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => {
                  const isSelected = activeCategory === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(c.id)
                        if (helperTrace && helperTrace.suggested !== c.id) {
                          setManualCorrected(true)
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#183f32] bg-[#f0f6ea] ring-2 ring-[#709549] shadow-xs'
                          : 'border-[#dce2d7] bg-white hover:border-[#b4c4ae]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {isSelected && <Check size={14} className="text-[#183f32]" />}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-extrabold text-[#183f32] leading-tight">
                          {c.name[lang] || c.name.en}
                        </div>
                        <div className="text-[10px] text-[#697d71] truncate mt-0.5">
                          {c.examples[lang] || c.examples.en}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {manualCorrected && (
                <div className="text-[11px] font-bold text-[#b8542b] flex items-center gap-1 pt-1">
                  <CheckCircle2 size={13} /> You manually corrected the suggested category. Recorded for dashboard accuracy metrics.
                </div>
              )}
            </div>

            {/* Preparation instruction */}
            <div className="p-3 rounded-xl bg-[#f0f5eb] border border-[#d6e2cf] text-xs font-semibold text-[#3b5930] flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5 text-[#547b36]" />
              <div>
                <strong>Prep requirement before pickup:</strong> {categoryDetails.prep[lang] || categoryDetails.prep.en}
              </div>
            </div>

            {/* Quantity and Add Item Bar */}
            <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-[#e2e6dc]">
              <div>
                <label className="text-[11px] font-extrabold text-[#3a5245] block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-extrabold text-center text-[#183f32]"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-[#3a5245] block mb-1">
                  Packaging Unit
                </label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value as UnitId)}
                  className="h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                >
                  <option value="smallbag">Small Bag (~0.5 - 2 kg)</option>
                  <option value="bucket">10L Bucket (~1 - 5 kg)</option>
                  <option value="sack">Full Sack (~3 - 15 kg)</option>
                  <option value="items">Individual Pieces</option>
                  <option value="kg">Custom Scale kg</option>
                </select>
              </div>

              <div className="flex-1 text-right">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="h-10 px-4 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold flex items-center gap-1.5 ml-auto hover:bg-[#102d24] shadow-xs"
                >
                  <Plus size={15} /> Add to Pickup List
                </button>
              </div>
            </div>
          </div>

          {/* Current Items Basket */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#183f32]">
                Items in this Pickup Request ({items.length})
              </h3>
              <div className="text-xs font-extrabold text-[#3a6828] bg-[#e6f1dc] px-2.5 py-1 rounded-lg">
                Estimated Total: ~{totalEstKg} kg
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-xs text-[#718479] text-center py-6 border border-dashed border-[#dce2d7] rounded-xl">
                No waste items added yet. Choose a category above and tap "Add to Pickup List".
              </div>
            ) : (
              <div className="divide-y divide-[#e6ebe0]">
                {items.map((it, idx) => {
                  const cat = CATEGORIES.find((c) => c.id === it.category)!
                  const estLineKg = round1(it.qty * UNIT_KG[it.category][it.unit])
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-extrabold text-[#183f32]">
                          {cat.name[lang] || cat.name.en}
                        </span>
                        <span className="text-[#687a70]">
                          ({it.qty} {it.unit} · ~{estLineKg} kg)
                        </span>
                        {it.helper && (
                          <span className="text-[10px] text-[#4d6c34] bg-[#eaf2e2] px-1.5 py-0.5 rounded">
                            {it.helper.source}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-[#ba472f] hover:text-[#912f1b] p-1 rounded"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-3 border-t border-[#e2e6dc] flex justify-end">
              <button
                disabled={items.length === 0}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 h-11 px-5 rounded-xl bg-[#e36338] text-white text-xs font-extrabold shadow-md hover:bg-[#cf552c] disabled:opacity-40"
              >
                Proceed to Schedule & Location <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: WHEN & WHERE (Scheduling) */}
      {step === 2 && reportKind === 'pickup' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-extrabold text-[#183f32] flex items-center gap-2">
              <CalendarDays size={18} className="text-[#597b37]" />
              Choose Doorstep Pickup Slot & Address
            </h2>

            {/* Date Selection */}
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-2">
                Pickup Date:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((daysAhead) => {
                  const d = addDays(todayIso(), daysAhead)
                  const isSelected = selectedDate === d
                  const label = daysAhead === 0 ? 'Today' : daysAhead === 1 ? 'Tomorrow' : d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`p-3 rounded-xl border text-center transition ${
                        isSelected
                          ? 'border-[#183f32] bg-[#f0f6ea] ring-2 ring-[#709549]'
                          : 'border-[#dce2d7] bg-white text-[#455c50] hover:border-[#b4c4ae]'
                      }`}
                    >
                      <div className="text-xs font-extrabold text-[#183f32]">{label}</div>
                      <div className="text-[10px] text-[#6d7e74] mt-0.5">{d}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Window Selection */}
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-2">
                Preferred Time Window:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SLOT_WINDOWS.map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => setSelectedWindow(win)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      selectedWindow === win
                        ? 'border-[#183f32] bg-[#f0f6ea] ring-2 ring-[#709549]'
                        : 'border-[#dce2d7] bg-white text-[#455c50] hover:border-[#b4c4ae]'
                    }`}
                  >
                    <Clock3 size={15} className="text-[#597939]" />
                    <span className="text-xs font-extrabold text-[#183f32]">{SLOT_LABEL[win]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e2e6dc]">
              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Ward
                </label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                >
                  {WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.rural ? '(Rural Area)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Doorstep Street / Flat / Landmark
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Flat 402, B-Wing, Shanti Nagar"
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Contact Person Name
                </label>
                <input
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Phone (for SMS arrival alert)
                </label>
                <input
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                Access note for collector (optional):
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Gate code 4812, 2nd floor, keep dry bags separate"
                className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              />
            </div>

            {/* Step navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e2e6dc]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
              >
                Back to Waste Items
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 h-11 px-5 rounded-xl bg-[#e36338] text-white text-xs font-extrabold shadow-md hover:bg-[#cf552c]"
              >
                Preview Collector Matches <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: MATCH PREVIEW */}
      {step === 3 && reportKind === 'pickup' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-[#183f32] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#597b37]" />
                Algorithmic Collector Matching Preview
              </h2>
              <p className="text-xs text-[#62776c] font-medium mt-0.5">
                Transparent ranking: Material Coverage (40%) + Proximity (25%) + Reliability (20%) + Daily Load Headroom (15%).
              </p>
            </div>

            {topCollector ? (
              <div className="p-4 rounded-xl border-2 border-[#548037] bg-[#f2f8eb] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#355722] bg-[#dbe8ce] px-2 py-0.5 rounded">
                      Rank #1 Best Match
                    </span>
                    <span className="text-xs font-bold text-[#456333]">
                      Match Score: {topCollector.score}/100
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-[#3a6828]">
                    {topCollector.partner.phone}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[#183f32]">
                  {topCollector.partner.name} ({topCollector.partner.org})
                </div>
                <div className="text-xs text-[#526b5c] font-medium">
                  {topCollector.partner.credential} · Covers: {topCollector.covered.join(', ')}
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] text-[#425d4f] font-semibold border-t border-[#d8e5cd]">
                  <div>Coverage: {Math.round(topCollector.parts.coverage * 100)}%</div>
                  <div>Proximity: {Math.round(topCollector.parts.proximity * 100)}%</div>
                  <div>Reliability: {Math.round(topCollector.parts.reliability * 100)}%</div>
                  <div>Capacity: {Math.round(topCollector.parts.load * 100)}% free</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#e8ce97] bg-[#fffbf2] text-xs font-semibold text-[#825b1e]">
                No verified collector currently serves all these streams in this ward. The Municipal Ward Office will be alerted for special manual assignment.
              </div>
            )}

            {/* Other candidates */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-extrabold text-[#3a5245]">
                Other Verified Partners in Network:
              </div>
              <div className="space-y-1.5">
                {collectorMatches.slice(1, 4).map((m) => (
                  <div
                    key={m.partner.id}
                    className="p-2.5 rounded-lg border border-[#e1e6db] bg-[#fafbf8] flex items-center justify-between text-xs font-semibold text-[#4e6457]"
                  >
                    <div>
                      <span className="font-extrabold text-[#183f32] mr-2">
                        {m.partner.name}
                      </span>
                      <span className="text-[10px] text-[#718478]">
                        Score: {m.score}% · {m.reasons.length > 0 ? m.reasons.join(', ') : 'Eligible backup'}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#5c7265]">
                      {m.partner.baseWard.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e2e6dc]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
              >
                Back to Schedule
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-2 h-11 px-5 rounded-xl bg-[#e36338] text-white text-xs font-extrabold shadow-md hover:bg-[#cf552c]"
              >
                Review Summary <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && reportKind === 'pickup' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-extrabold text-[#183f32] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#597b37]" />
              Confirm Your Pickup Request
            </h2>

            <div className="p-4 rounded-xl bg-[#f5f8f2] border border-[#dbe6d3] divide-y divide-[#e2ebda] text-xs font-medium space-y-2">
              <div className="flex justify-between py-1.5">
                <span className="text-[#65796d]">Scheduled Window:</span>
                <span className="font-extrabold text-[#183f32]">
                  {selectedDate} ({SLOT_LABEL[selectedWindow]})
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#65796d]">Pickup Location:</span>
                <span className="font-extrabold text-[#183f32]">
                  {address}, {ward}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#65796d]">Items to Collect:</span>
                <span className="font-extrabold text-[#183f32]">
                  {items.map((i) => `${i.qty} ${i.unit} ${i.category}`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#65796d]">Planning Estimate:</span>
                <span className="font-extrabold text-[#183f32]">
                  ~{totalEstKg} kg (Certified weight entered at door)
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#65796d]">Matched Partner:</span>
                <span className="font-extrabold text-[#183f32]">
                  {topCollector ? topCollector.partner.name : 'Municipal Ward Pool'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#eef4e8] border border-[#d2dfc9] text-xs font-semibold text-[#486337]">
              Upon submission, you will receive an automated SMS confirmation. The collector will phone you 15 minutes before arriving.
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#e2e6dc]">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 h-12 px-6 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-lg hover:bg-[#102d24]"
              >
                <Check size={16} /> Submit & Dispatch Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DUMPING REPORT FLOW */}
      {reportKind === 'dumping' && (
        <div className="rounded-2xl border border-[#e8d2c8] bg-white p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#b83d1c]">
            <Flame size={18} /> Public Sanitation Incident: Unregulated Dumping
          </div>

          <p className="text-xs text-[#63776d] font-medium leading-relaxed">
            Dumping reports are broadcasted immediately to the Ward Health Inspector and the nearest verified rural clearance crew.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                Ward / Village Location
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              >
                {WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.rural ? '(Rural)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                Spot Landmark / Road / Canal
              </label>
              <input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near canal bridge, approach road"
                className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#3a5245] block mb-2">
              Estimated Waste Heap Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'small', title: 'Small Heap', sub: '~25 kg (Few bags)' },
                { id: 'medium', title: 'Medium Heap', sub: '~150 kg (Handcart)' },
                { id: 'large', title: 'Large Heap', sub: '~600 kg (Tractor load)' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHeapSize(h.id as HeapSize)}
                  className={`p-3 rounded-xl border text-center transition ${
                    heapSize === h.id
                      ? 'border-[#ba3d20] bg-[#fff5f2] ring-2 ring-[#ba3d20]'
                      : 'border-[#dce2d7] bg-white text-[#455c50]'
                  }`}
                >
                  <div className="text-xs font-extrabold text-[#183f32]">{h.title}</div>
                  <div className="text-[10px] text-[#6d7e74] mt-0.5">{h.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Burning Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-[#f0c4b4] bg-[#fff5f2] cursor-pointer">
            <input
              type="checkbox"
              checked={isBurning}
              onChange={(e) => setIsBurning(e.target.checked)}
              className="h-4 w-4 accent-[#ba3d20]"
            />
            <div className="text-xs font-extrabold text-[#962d14]">
              Active Burning / Smoke Detected (Triggers priority fire hazard dispatch)
            </div>
          </label>

          <div className="flex items-center justify-between pt-3 border-t border-[#e2e6dc]">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-[#ba3d20] text-white text-xs font-extrabold shadow-md hover:bg-[#a03117]"
            >
              <Check size={16} /> Broadcast Dumping Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
