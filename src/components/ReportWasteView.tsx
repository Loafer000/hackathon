import React, { useState, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Camera,
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Calendar,
  MapPin,
  Flame,
  ShieldCheck,
  Check,
  ArrowRight,
  HelpCircle,
  X,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT, LANG_NAMES } from '../lib/i18n'
import { CATEGORIES, WARDS, SLOT_WINDOWS, SLOT_LABEL, matchRules, UNIT_KG } from '../lib/data'
import { rankCollectors } from '../lib/match'
import { analysePhoto } from '../lib/photoHint'
import { LiveCameraModal } from './LiveCameraModal'
import { round1, addDays, todayIso } from '../lib/format'
import type { CategoryId, UnitId, HeapSize, NewItem, RequestKind, HelperTrace } from '../lib/types'

interface ReportWasteViewProps {
  onSuccess: (requestId: string) => void
  onCancel: () => void
}

export function ReportWasteView({ onSuccess, onCancel }: ReportWasteViewProps) {
  const state = useApp()
  const { session } = useApp()
  const { t, tr, lang } = useT()

  // Mode: Doorstep Pickup vs Public Dumping Incident
  const [reportKind, setReportKind] = useState<RequestKind>('pickup')

  // Step state for multi-step flow (1: What waste, 2: Place & time, 3: Review)
  const [step, setStep] = useState<number>(1)

  // Items basket
  const [items, setItems] = useState<NewItem[]>([
    { category: 'plastic', qty: 2, unit: 'smallbag' },
  ])

  // Category Helper state
  const [searchQuery, setSearchQuery] = useState('')
  const [helperTrace, setHelperTrace] = useState<HelperTrace | undefined>(undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [manualCorrected, setManualCorrected] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryId>('plastic')

  // Schedule & Address
  const [selectedDate, setSelectedDate] = useState<string>(addDays(todayIso(), 1))
  const [selectedWindow, setSelectedWindow] = useState<'07-09' | '09-11' | '17-19'>('09-11')
  const [ward, setWard] = useState<string>(session.userWard || 'w2')
  const [address, setAddress] = useState<string>(session.userAddress || '')
  const [reporterName, setReporterName] = useState<string>(session.userName || '')
  const [reporterPhone, setReporterPhone] = useState<string>(session.userPhone || '')
  const [note, setNote] = useState<string>('')

  // Dumping specific fields
  const [heapSize, setHeapSize] = useState<HeapSize>('medium')
  const [isBurning, setIsBurning] = useState(false)
  const [landmark, setLandmark] = useState('')

  // Issue 9: Popup for broadcast dumping report
  const [dumpingPopup, setDumpingPopup] = useState<{ id: string } | null>(null)

  // Current item builder inputs
  const [itemQty, setItemQty] = useState<number>(1)
  const [itemUnit, setItemUnit] = useState<UnitId>('smallbag')

  // Quick prebuilt sample photos
  const SAMPLE_ITEMS = [
    { label: 'Milk pouch & PET bottles', category: 'plastic' as CategoryId },
    { label: 'Cardboard carton & raddi', category: 'paper' as CategoryId },
    { label: 'Cooked food scraps & peels', category: 'organic' as CategoryId },
    { label: 'Beer & pickle glass jars', category: 'glass' as CategoryId },
  ]

  // Issue 7: Enhanced rule matching from search bar
  const ruleMatches = useMemo(() => matchRules(searchQuery), [searchQuery])

  // Calculate live planning estimate (kg)
  const totalEstKg = useMemo(() => {
    return round1(
      items.reduce((acc, it) => {
        const factor = UNIT_KG[it.category]?.[it.unit] || 1
        return acc + it.qty * factor
      }, 0)
    )
  }, [items])

  // Find likely collector match
  const previewReq = {
    id: 'PREVIEW',
    kind: reportKind,
    lang,
    createdAt: Date.now(),
    reporter: { name: reporterName, phone: reporterPhone, type: session.userType },
    ward,
    address,
    items: items.map((it, idx) => ({
      id: `preview-${idx}`,
      category: it.category,
      qty: it.qty,
      unit: it.unit,
      estKg: it.qty * (UNIT_KG[it.category]?.[it.unit] || 1),
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

  // Issue 6: Remove photo handler
  function handleRemovePhoto() {
    setPhotoPreview(null)
    if (helperTrace?.source === 'photo') {
      setHelperTrace(undefined)
    }
  }

  async function handleCameraCapture(dataUrl: string) {
    setPhotoPreview(dataUrl)
    setIsCameraOpen(false)
    setIsAnalysing(true)
    try {
      const { suggestions } = await analysePhoto(dataUrl)
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

  // Issue 7: Enter key or click in search bar
  function handleSearchSelect(catId: CategoryId) {
    setActiveCategory(catId)
    setHelperTrace({
      source: 'search',
      suggested: catId,
      confidence: 0.85,
    })
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (ruleMatches.length > 0) {
        handleSearchSelect(ruleMatches[0].category)
      }
    }
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

    if (reportKind === 'dumping') {
      // Issue 9: Pop up message for broadcast dumping report
      setDumpingPopup({ id: reqId })
    } else {
      onSuccess(reqId)
    }
  }

  const categoryDetails = CATEGORIES.find((c) => c.id === activeCategory)!

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e6db] pb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567534]">
            {tr('Traceable Waste Reporting Flow')}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#183f32] mt-0.5">
            {reportKind === 'pickup' ? tr('Schedule a Doorstep Pickup') : tr('Report Illegal Dumping')}
          </h1>
          <p className="text-xs font-semibold text-[#667a6e] mt-1">
            {reportKind === 'pickup'
              ? tr('Sort waste at source, get matched with verified collectors, and receive SMS confirmation.')
              : tr('Report unmanaged open dumping or burning for urgent municipal cleanup within 48h.')}
          </p>
        </div>

        {/* Toggle Report Type */}
        <div className="flex rounded-xl bg-[#eaf0e2] p-1 border border-[#d2d9cc]">
          <button
            type="button"
            onClick={() => setReportKind('pickup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              reportKind === 'pickup'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:text-[#183f32]'
            }`}
          >
            {tr('Doorstep Pickup')}
          </button>
          <button
            type="button"
            onClick={() => setReportKind('dumping')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
              reportKind === 'dumping'
                ? 'bg-[#ba3d20] text-white shadow-xs'
                : 'text-[#486053] hover:text-[#183f32]'
            }`}
          >
            {tr('Open Dumping / Burning')}
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      {reportKind === 'pickup' && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { n: 1, title: tr('1. What Waste') },
            { n: 2, title: tr('2. When & Where') },
            { n: 3, title: tr('3. Match Preview') },
            { n: 4, title: tr('4. Confirmation') },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => {
                if (items.length > 0 || s.n === 1) setStep(s.n)
              }}
              className={`p-2.5 rounded-xl border text-left transition ${
                step === s.n
                  ? 'border-[#183f32] bg-[#183f32] text-[#dff47d] shadow-xs'
                  : step > s.n
                  ? 'border-[#c5d3bd] bg-[#eef5e7] text-[#335626]'
                  : 'border-[#dce2d7] bg-white text-[#6b7f73]'
              }`}
            >
              <div className="text-[10px] font-bold opacity-75 uppercase">{tr('Step')} 0{s.n}</div>
              <div className="text-xs font-extrabold mt-0.5">{s.title}</div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: What Waste - Helper & Categories */}
      {reportKind === 'pickup' && step === 1 && (
        <div className="space-y-6">
          {/* Category Helper Card */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#476829]">
                  <Sparkles size={15} />
                  <span>{tr('Source Segregation Manual')}</span>
                </div>
                <h2 className="font-display text-xl text-[#183f32] mt-0.5">
                  {tr('1. What Waste')}
                </h2>
                <p className="text-xs text-[#62776c] font-medium mt-0.5">
                  {tr('Search an item (English, Hindi, Bengali, Hinglish):')}
                </p>
              </div>
            </div>

            {/* Crucial Human Cross-Check Disclaimer */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#e8d7ae] bg-[#fffaf0] text-xs font-semibold text-[#73511f]">
              <AlertTriangle size={18} className="shrink-0 text-[#a06b1b] mt-0.5" />
              <div>
                <span className="font-extrabold">{tr('Human Cross-Check & Verification Policy')}:</span> {tr('Image and rule-based suggestions are planning estimates only and are never claimed as 100% correct. You can freely change the category below. The collector will physically inspect and certify the bags with a digital scale before any recovery record is generated.')}
              </div>
            </div>

            {/* Issue 7: Keyword Rule Search Bar with Instant Matching */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-[#3a5245]">
                {tr('Search an item (English, Hindi, Bengali, Hinglish):')}
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[#708477]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="e.g., milk pouch, doodh packet, chai patti, cardboard, CFL, medicine, plastic bottle"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#d2d9cc] bg-[#f9faf7] text-xs font-bold text-[#183f32] outline-none focus:border-[#4d722e]"
                />
              </div>

              {/* Keyword Rule Suggestions */}
              {ruleMatches.length > 0 && (
                <div className="p-3 rounded-xl bg-[#edf5e3] border border-[#d4e3c5] space-y-2">
                  <div className="text-[11px] font-extrabold text-[#3b592b]">
                    {tr('Matched Rule Suggestions:')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ruleMatches.map((m) => {
                      const cat = CATEGORIES.find((c) => c.id === m.category)!
                      const isSelected = activeCategory === m.category
                      return (
                        <button
                          key={m.category}
                          type="button"
                          onClick={() => handleSearchSelect(m.category)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#183f32] text-[#dff47d] border-[#183f32]'
                              : 'bg-white border-[#c9d7be] text-[#3c592a] hover:bg-[#e4eed7]'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span>{cat.name[lang] || cat.name.en}</span>
                          <span className="text-[10px] opacity-70">({m.keyword})</span>
                          {isSelected && <Check size={12} />}
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

            {/* Photo / Live Camera / Sample Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Photo Input with Live Camera and Remove Option */}
              <div className="flex flex-col space-y-2">
                {photoPreview ? (
                  <div className="rounded-xl border border-[#c9d5c3] bg-[#f7f9f4] p-3 text-center space-y-2">
                    <img
                      src={photoPreview}
                      alt="Captured waste"
                      className="h-28 w-full max-w-[200px] object-cover rounded-lg mx-auto shadow-xs border border-[#ccd5c3]"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#183f32] text-[#dff47d] text-xs font-extrabold hover:bg-[#112d24] transition shadow-2xs"
                      >
                        <Camera size={13} />
                        <span>{tr('Open Live Camera')}</span>
                      </button>
                      <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#c7d3be] text-[#345325] text-xs font-bold hover:bg-[#ebf2e3] cursor-pointer transition shadow-2xs">
                        <RefreshCw size={12} />
                        <span>{tr('Replace photo')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ffebe6] text-[#b43e26] hover:bg-[#fcd9d2] text-xs font-extrabold border border-[#f5c4b8] transition shadow-2xs"
                      >
                        <Trash2 size={12} />
                        <span>{tr('Remove Photo')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#183f32] hover:bg-[#112d24] text-[#dff47d] text-xs font-extrabold shadow-sm transition group"
                    >
                      <Camera size={18} className="group-hover:scale-110 transition-transform" />
                      <span>{tr('Open Live Camera')}</span>
                    </button>

                    <label className="flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-[#ccd6c5] bg-[#f7f9f4] hover:bg-[#edf3e6] cursor-pointer transition text-center min-h-[95px]">
                      <div className="text-xs font-extrabold text-[#183f32]">
                        {tr('Upload photo for prebuilt visual hint')}
                      </div>
                      <div className="text-[10px] text-[#718579] mt-0.5">
                        {tr('Analyzes color & brightness in browser')}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Prebuilt Samples */}
              <div className="p-3 rounded-xl border border-[#dce2d7] bg-[#f9faf7]">
                <div className="text-[11px] font-extrabold text-[#475d50] mb-2">
                  {tr('Or select test waste sample:')}
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
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
                  {tr('Active Waste Stream:')}
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
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {isSelected && <Check size={14} className="text-[#3b6326]" strokeWidth={3} />}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-extrabold text-[#183f32]">
                          {c.name[lang] || c.name.en}
                        </div>
                        <div className="text-[10px] text-[#6d7f74] font-medium capitalize mt-0.5">
                          {c.stream} stream
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {manualCorrected && (
                <div className="p-2.5 rounded-xl bg-[#f0f6eb] border border-[#d6e2cf] text-[11px] text-[#3e5f29] font-medium">
                  <strong>Category corrected by user.</strong> This correction will be logged on the municipal transparency dashboard.
                </div>
              )}
            </div>

            {/* Quantity and Unit Input */}
            <div className="pt-2 border-t border-[#e2e6dc] grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="h-10 w-10 rounded-xl bg-[#f0f4ea] border border-[#ccd7c5] font-bold text-sm text-[#183f32]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 text-center rounded-xl border border-[#ccd7c5] bg-white font-mono text-sm font-extrabold text-[#183f32] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setItemQty(itemQty + 1)}
                    className="h-10 w-10 rounded-xl bg-[#f0f4ea] border border-[#ccd7c5] font-bold text-sm text-[#183f32]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                  Packaging / Bag Unit
                </label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value as UnitId)}
                  className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
                >
                  <option value="smallbag">Small Bag (~{UNIT_KG[activeCategory]?.smallbag} kg)</option>
                  <option value="bucket">10L Bucket (~{UNIT_KG[activeCategory]?.bucket} kg)</option>
                  <option value="sack">Sack (~{UNIT_KG[activeCategory]?.sack} kg)</option>
                  <option value="items">Pieces / Items (~{UNIT_KG[activeCategory]?.items} kg)</option>
                  <option value="kg">Direct Scale kg</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-sm hover:bg-[#122e25]"
                >
                  <Plus size={16} />
                  <span>{tr('Add Item to Pickup')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Pickup Basket */}
          <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-[#183f32]">
                  Selected Waste Items ({items.length})
                </h3>
                <p className="text-xs text-[#63796d] font-medium mt-0.5">
                  Doorstep scale certification is performed on pickup.
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#637a6e]">
                  Total Estimate
                </div>
                <div className="text-lg font-extrabold text-[#183f32]">
                  ~{totalEstKg} kg
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#718579] border border-dashed border-[#ccd6c5] rounded-xl">
                No items added yet. Search or tap a category above to add.
              </div>
            ) : (
              <div className="divide-y divide-[#e2e7dc]">
                {items.map((it, idx) => {
                  const cat = CATEGORIES.find((c) => c.id === it.category)!
                  const factor = UNIT_KG[it.category]?.[it.unit] || 1
                  const est = round1(it.qty * factor)
                  return (
                    <div
                      key={idx}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <span className="font-extrabold text-[#183f32]">
                            {cat.name[lang] || cat.name.en}
                          </span>
                          <span className="text-[#597063] font-semibold ml-2">
                            {it.qty} {it.unit}
                          </span>
                          {it.helper && (
                            <span className="ml-2 text-[10px] text-[#486b2a] bg-[#e4efd8] px-1.5 py-0.5 rounded">
                              {it.helper.source === 'photo' ? 'Photo hint' : 'Search match'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#55695d]">
                          ~{est} kg
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[#b14732] hover:bg-[#fff0eb] p-1.5 rounded-lg"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-3 border-t border-[#e2e6dc] flex items-center justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-bold text-[#5e7166] hover:text-[#183f32]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 h-11 px-6 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#112d23] disabled:opacity-40"
              >
                <span>Continue to Step 2: Slot & Address</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Place & Slot Scheduling */}
      {reportKind === 'pickup' && step === 2 && (
        <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-6 shadow-xs">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567534]">
              {tr('Step 2: Pickup Slot & Address')}
            </div>
            <h2 className="font-display text-xl text-[#183f32] mt-0.5">
              Choose Date, Time & Doorstep Address
            </h2>
            <p className="text-xs text-[#63796d] font-medium mt-0.5">
              Verified collectors in your ward adhere to 2-hour collection windows.
            </p>
          </div>

          {/* Date and Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Pickup Date')}
              </label>
              <input
                type="date"
                min={todayIso()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Time Window')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SLOT_WINDOWS.map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => setSelectedWindow(win)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-extrabold transition ${
                      selectedWindow === win
                        ? 'border-[#183f32] bg-[#f0f6eb] text-[#183f32] ring-2 ring-[#70954b]'
                        : 'border-[#d2d9cc] bg-white text-[#55695d]'
                    }`}
                  >
                    {SLOT_LABEL[win]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ward and Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Municipal Ward')}
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              >
                {WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.id.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('House / Building / Street Address')}
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House No, Apartment, Street Name"
                className="w-full h-11 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              />
            </div>
          </div>

          {/* Reporter details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Full Name')}
              </label>
              <input
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Meera Joshi"
                className="w-full h-11 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Phone Number')} (for collector SMS & call)
              </label>
              <input
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="98220 41736"
                className="w-full h-11 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
              {tr('Instructions or Landmark for Collector (Optional)')}
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Near yellow water tank, ring bell for Flat 4"
              className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-semibold text-[#183f32] outline-none"
            />
          </div>

          <div className="pt-4 border-t border-[#e2e6dc] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
            >
              {tr('Back to Items')}
            </button>
            <button
              type="button"
              disabled={!address.trim() || !reporterPhone.trim()}
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 h-11 px-6 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#112d23] disabled:opacity-40"
            >
              <span>{tr('Continue to Collector Match')}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Matching Preview */}
      {reportKind === 'pickup' && step === 3 && (
        <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-6 shadow-xs">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567534]">
              {tr('Collector Matching Preview:')}
            </div>
            <h2 className="font-display text-xl text-[#183f32] mt-0.5">
              {tr('Verified Collector Matching Preview')}
            </h2>
            <p className="text-xs text-[#63796d] font-medium mt-0.5">
              {tr('Algorithm matches coverage, distance, rating, and vehicle capacity.')}
            </p>
          </div>

          {topCollector ? (
            <div className="p-4 rounded-2xl border border-[#bddbb0] bg-[#f2f8ed] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#345b1e] bg-[#dbe8cb] px-2 py-0.5 rounded">
                  {tr('Best Match')} ({tr('Score')}: {topCollector.score}/100)
                </span>
                <span className="text-xs font-bold text-[#446530]">
                  {tr('Estimated Arrival:')} {SLOT_LABEL[selectedWindow]}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#183f32] text-[#dff47d] grid place-items-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#183f32]">
                    {topCollector.partner.name}
                  </h3>
                  <div className="text-xs text-[#4f6758] font-semibold">
                    {topCollector.partner.org} · Base Ward: {topCollector.partner.baseWard.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-[#697f73] mt-0.5 font-medium">
                    {tr('Credentials:')} {topCollector.partner.credential} · {tr('Rating: 98% on-time')}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[#e8d7ae] bg-[#fffaf0] text-xs font-semibold text-[#7c5b1e]">
              No direct verified partner has open capacity in Ward {ward} for this slot. The municipal ward sanitation coordinator will dispatch a buffer vehicle.
            </div>
          )}

          {/* Summary Details */}
          <div className="rounded-xl border border-[#e2e6dc] p-4 bg-[#fafbf7] text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-[#e5e9df]">
              <span className="text-[#65796d]">{tr('Pickup Schedule:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {selectedDate} ({SLOT_LABEL[selectedWindow]})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#e5e9df]">
              <span className="text-[#65796d]">{tr('Pickup Address:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {address}, {ward}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#65796d]">{tr('Total Estimated Waste:')}</span>
              <span className="font-extrabold text-[#183f32]">
                ~{totalEstKg} kg ({items.length} streams)
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e2e6dc] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
            >
              {tr('Back to Slot')}
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 h-11 px-6 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#112d23]"
            >
              <span>{tr('Review & Confirm Request')}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Final Confirmation */}
      {reportKind === 'pickup' && step === 4 && (
        <div className="rounded-2xl border border-[#dce2d6] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567534]">
              {tr('Step 4: Final Confirmation')}
            </div>
            <h2 className="font-display text-xl text-[#183f32] mt-0.5">
              {tr('Confirm & Dispatch Pickup Job')}
            </h2>
          </div>

          <div className="rounded-xl border border-[#dce2d6] bg-[#fafbf7] p-4 text-xs divide-y divide-[#e2e6dc]">
            <div className="flex justify-between py-1.5">
              <span className="text-[#65796d]">{tr('Citizen / Reporter:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {reporterName} ({reporterPhone})
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#65796d]">{tr('Scheduled Slot:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {selectedDate} ({SLOT_LABEL[selectedWindow]})
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#65796d]">{tr('Pickup Location:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {address}, {ward}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#65796d]">{tr('Items to Collect:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {items.map((i) => `${i.qty} ${tr(i.unit)} ${tr(i.category)}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#65796d]">{tr('Planning Estimate:')}</span>
              <span className="font-extrabold text-[#183f32]">
                ~{totalEstKg} kg ({tr('Certified weight entered at door')})
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#65796d]">{tr('Matched Partner:')}</span>
              <span className="font-extrabold text-[#183f32]">
                {topCollector ? topCollector.partner.name : tr('Municipal Ward Pool')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#eef4e8] border border-[#d2dfc9] text-xs font-semibold text-[#486337]">
            {tr('Upon submission, you will receive an automated SMS confirmation. The collector will phone you 15 minutes before arriving.')}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#e2e6dc]">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
            >
              {tr('Back')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 h-12 px-6 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-lg hover:bg-[#102d24]"
            >
              <Check size={16} /> {tr('Submit & Dispatch Request')}
            </button>
          </div>
        </div>
      )}

      {/* DUMPING REPORT FLOW */}
      {reportKind === 'dumping' && (
        <div className="rounded-2xl border border-[#e8d2c8] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#b83d1c]">
            <Flame size={18} /> {tr('Public Sanitation Incident: Unregulated Dumping')}
          </div>

          <p className="text-xs text-[#63776d] font-medium leading-relaxed">
            {tr('Dumping reports are broadcasted immediately to the Ward Health Inspector and the nearest verified rural clearance crew.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Ward / Village Location')}
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#d2d9cc] bg-white text-xs font-bold text-[#183f32] outline-none"
              >
                {WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.rural ? `(${tr('Rural')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#3a5245] block mb-1">
                {tr('Spot Landmark / Road / Canal')}
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
              {tr('Estimated Waste Heap Size')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'small', title: tr('Small Heap'), sub: '~25 kg' },
                { id: 'medium', title: tr('Medium Heap'), sub: '~150 kg' },
                { id: 'large', title: tr('Large Heap'), sub: '~600 kg' },
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

          {/* Photo of Dumping Site */}
          <div>
            <label className="text-xs font-extrabold text-[#3a5245] block mb-1.5">
              {tr('Attach Incident Photo (Camera or Upload)')}
            </label>
            {photoPreview ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#d2d9cc] bg-[#f9faf7]">
                <img src={photoPreview} alt="Dumping spot" className="h-16 w-20 object-cover rounded-lg" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#183f32]">{tr('Photo attached to incident ticket')}</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsCameraOpen(true)} className="text-[11px] font-bold text-[#3d6229] hover:underline">
                      {tr('Retake with camera')}
                    </button>
                    <button type="button" onClick={handleRemovePhoto} className="text-[11px] font-bold text-[#b43e26] hover:underline">
                      {tr('Remove Photo')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold hover:bg-[#112d23] transition"
                >
                  <Camera size={15} />
                  <span>{tr('Capture Live Photo')}</span>
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#ccd5c3] bg-white text-[#385328] text-xs font-extrabold hover:bg-[#ebf2e3] cursor-pointer transition">
                  <RefreshCw size={14} />
                  <span>{tr('Upload File')}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
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
              {tr('Active Burning / Smoke Detected (Triggers priority fire hazard dispatch)')}
            </div>
          </label>

          <div className="flex items-center justify-between pt-3 border-t border-[#e2e6dc]">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-[#55695e] hover:text-[#183f32]"
            >
              {tr('Cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-[#ba3d20] text-white text-xs font-extrabold shadow-md hover:bg-[#a03117]"
            >
              <Check size={16} /> {tr('Broadcast Dumping Report')}
            </button>
          </div>
        </div>
      )}

      {/* Issue 9: Modal Popup Confirmation for Broadcast Dumping Report */}
      {dumpingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-[#dce0d4] shadow-2xl p-6 text-[#18392b] space-y-4 animate-scale-in">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-[#ba3d20] text-white grid place-items-center shadow-md shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ba3d20]">
                  {tr('Broadcast Dumping Report Submitted')}
                </span>
                <h2 className="font-display text-xl text-[#183f32]">
                  {dumpingPopup.id}
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eedab2] bg-[#fffaf0] p-4 space-y-2 text-xs font-semibold text-[#6e4e1a]">
              <div className="flex items-center gap-2 font-extrabold text-[#9c3d18]">
                <CheckCircle2 size={16} />
                <span>{tr('Alert dispatched to Ward Inspector and Nearest Cleanup Crew with 48h SLA')}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#755523]">
                The GPS coordinates, photo, and estimated waste heap have been broadcasted to the sanitation response unit. A municipal sanitary officer will inspect and initiate clearance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#f4f7f0] border border-[#dce3d6]">
                <div className="text-[10px] text-[#697f72] font-bold uppercase">{tr('Incident Tracking ID:')}</div>
                <div className="font-mono font-extrabold text-[#183f32] mt-0.5">{dumpingPopup.id}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f4f7f0] border border-[#dce3d6]">
                <div className="text-[10px] text-[#697f72] font-bold uppercase">{tr('Target SLA Clearance:')}</div>
                <div className="font-extrabold text-[#28571e] mt-0.5">{tr('Within 48 Hours')}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const id = dumpingPopup.id
                setDumpingPopup(null)
                onSuccess(id)
              }}
              className="w-full h-11 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-md hover:bg-[#112d23] transition flex items-center justify-center gap-2"
            >
              <span>{tr('Close & Track on Map')}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
