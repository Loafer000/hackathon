import React, { useState } from 'react'
import {
  LayoutDashboard,
  PlusCircle,
  Truck,
  Factory,
  Route,
  BookOpen,
  Handshake,
  UserRound,
  ShieldCheck,
  Building2,
  CheckCircle2,
  RotateCcw,
  Recycle,
  Mic,
  Scale,
  AlertTriangle,
  LogOut,
} from 'lucide-react'
import { useApp, actions } from './lib/store'
import { useT } from './lib/i18n'
import type { Role, CategoryId } from './lib/types'

// Components
import { Navbar } from './components/Navbar'
import { VoiceGuideModal } from './components/VoiceGuideModal'
import { RoleLoginModal } from './components/RoleLoginModal'
import { MethodologyModal } from './components/MethodologyModal'
import { CitizenHome } from './components/CitizenHome'
import { ReportWasteView } from './components/ReportWasteView'
import { CollectorView } from './components/CollectorView'
import { RecyclerView } from './components/RecyclerView'
import { DashboardView } from './components/DashboardView'
import { PartnersDirectory } from './components/PartnersDirectory'
import { TraceView } from './components/TraceView'
import { SegregationGuideView } from './components/SegregationGuideView'

export function App() {
  const { session } = useApp()
  const { tr } = useT()

  // Navigation view state
  const [activeView, setActiveView] = useState<string>('home')
  const [traceId, setTraceId] = useState<string | undefined>(undefined)

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [voiceCategory, setVoiceCategory] = useState<CategoryId | undefined>(undefined)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [methodModalOpen, setMethodModalOpen] = useState(false)

  // Toast feedback state
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3500)
  }

  function handleOpenVoice(cat?: CategoryId) {
    setVoiceCategory(cat)
    setVoiceModalOpen(true)
  }

  function handleSelectTrace(id: string) {
    setTraceId(id)
    setActiveView('trace')
  }

  function handleReportSuccess(reqId: string) {
    showToast(`Request ${reqId} successfully submitted! Dispatched to matching collector.`)
    setActiveView('home')
  }

  function handleResetDemo() {
    actions.resetDemo()
    showToast('Sample dataset restored with multi-month circular audit trail.')
  }

  // Issue 1: When opened in web, the login page should open first!
  if (!session.onboarded) {
    return (
      <RoleLoginModal
        isOpen={true}
        isInitialScreen={true}
        onClose={() => {}}
      />
    )
  }

  // Issue 13: Role-tailored navigation items
  const roleNavItems =
    session.role === 'collector'
      ? [
          { id: 'home', label: tr('Daily Route & Stops'), icon: Route },
          { id: 'collector-weigh', label: tr('Doorstep Weigh-in'), icon: Scale },
          { id: 'collector-dispatch', label: tr('Vehicle Load & Dispatch'), icon: Truck },
          { id: 'trace', label: tr('Route Manifests'), icon: CheckCircle2 },
          { id: 'partners', label: tr('Recycler Directory'), icon: Handshake },
          { id: 'dashboard', label: tr('Collector Metrics'), icon: Recycle },
        ]
      : session.role === 'processor'
      ? [
          { id: 'home', label: tr('Inbound Manifests'), icon: Truck },
          { id: 'recycler-intake', label: tr('Facility Intake'), icon: Scale },
          { id: 'recycler-balance', label: tr('Mass Balance Ledger'), icon: Factory },
          { id: 'trace', label: tr('Material Trace Records'), icon: Route },
          { id: 'partners', label: tr('Supplying Collectors'), icon: Handshake },
          { id: 'dashboard', label: tr('Facility Metrics'), icon: Recycle },
        ]
      : session.role === 'admin'
      ? [
          { id: 'home', label: tr('Ward Overview'), icon: Building2 },
          { id: 'ward-dumping', label: tr('Dumping Alerts & Hotspots'), icon: AlertTriangle },
          { id: 'partners', label: tr('Partner Verifications'), icon: ShieldCheck },
          { id: 'trace', label: tr('Traceability Audit'), icon: Route },
          { id: 'dashboard', label: tr('Municipal Metrics'), icon: Recycle },
        ]
      : [
          { id: 'home', label: tr('My Pickups & Requests'), icon: LayoutDashboard },
          { id: 'report', label: tr('Request Pickup'), icon: PlusCircle },
          { id: 'guide', label: tr('Basic Segregation Guide'), icon: BookOpen },
          { id: 'trace', label: tr('Trace My Material'), icon: Route },
          { id: 'partners', label: tr('Verified Partners'), icon: Handshake },
          { id: 'dashboard', label: tr('City Recovery Metrics'), icon: Recycle },
        ]

  return (
    <div className="min-h-screen bg-[#f5f6f1] text-[#1b382d] flex flex-col font-sans selection:bg-[#dff47d] selection:text-[#183f32]">
      {/* Top Navigation */}
      <Navbar
        onOpenVoice={() => handleOpenVoice()}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenMethod={() => setMethodModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-8 flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar Navigation (Issue 13: Role Tailored) */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 space-y-1 self-start sticky top-20">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#728579] px-3 pb-2">
            {tr('Navigation')}
          </div>

          {roleNavItems.map((item) => {
            const Icon = item.icon
            const isSelected = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'trace') setTraceId(undefined)
                  setActiveView(item.id)
                }}
                className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
                  isSelected
                    ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                    : 'text-[#486053] hover:bg-[#e9eee2]'
                }`}
              >
                <Icon size={16} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}

          {/* Quick role-specific button & Logout */}
          <div className="pt-4 border-t border-[#e2e6dc] space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#728579] px-3">
              {tr('Interface Role')}
            </div>

            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center justify-between w-full p-2.5 rounded-xl border border-[#d6ddd0] bg-white text-left hover:bg-[#f2f6ee] text-xs font-bold text-[#2e473a]"
            >
              <div className="flex items-center gap-2">
                <span className="capitalize">
                  {tr(session.role === 'generator' ? 'Citizen' : session.role === 'collector' ? 'Collector' : session.role === 'processor' ? 'Recycler' : 'Ward Office')}
                </span>
              </div>
              <span className="text-[10px] text-[#4f7035] font-extrabold uppercase">
                {tr('Switch')}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] font-bold text-[#6a7d72] hover:text-[#183f32]"
              title="Reset sample dataset"
            >
              <RotateCcw size={13} />
              <span>{tr('Reset Sample Data')}</span>
            </button>
          </div>
        </aside>

        {/* Dynamic View Main Content */}
        <main className="flex-1 min-w-0">
          {activeView === 'report' ? (
            <ReportWasteView
              onSuccess={handleReportSuccess}
              onCancel={() => setActiveView('home')}
            />
          ) : activeView === 'dashboard' || activeView === 'ward-dumping' ? (
            <DashboardView />
          ) : activeView === 'guide' ? (
            <SegregationGuideView onOpenVoiceCategory={handleOpenVoice} />
          ) : activeView === 'partners' ? (
            <PartnersDirectory />
          ) : activeView === 'trace' ? (
            <TraceView initialId={traceId} />
          ) : (
            // Role tailored home views
            session.role === 'collector' ? (
              <CollectorView />
            ) : session.role === 'processor' ? (
              <RecyclerView />
            ) : session.role === 'admin' ? (
              <DashboardView />
            ) : (
              <CitizenHome
                onStartReport={() => setActiveView('report')}
                onOpenVoice={() => handleOpenVoice()}
                onSelectTrace={handleSelectTrace}
              />
            )
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Issue 13: Role Tailored) */}
      <nav className="fixed inset-x-2 bottom-2 z-40 md:hidden grid grid-cols-5 rounded-2xl border border-[#d4dbce] bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
        {roleNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          const isSelected = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'trace') setTraceId(undefined)
                setActiveView(item.id)
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold ${
                isSelected ? 'bg-[#183f32] text-[#dff47d]' : 'text-[#64796e]'
              }`}
            >
              <Icon size={17} />
              <span className="mt-0.5 truncate max-w-[56px]">{item.label}</span>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => handleOpenVoice()}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold text-[#295620] bg-[#eef7e6]"
        >
          <Mic size={17} />
          <span className="mt-0.5">{tr('Voice Instructions')}</span>
        </button>
      </nav>

      {/* Modals */}
      <VoiceGuideModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        initialCategory={voiceCategory}
      />

      <RoleLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <MethodologyModal
        isOpen={methodModalOpen}
        onClose={() => setMethodModalOpen(false)}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-2xl animate-fade-in border border-[#2b5748]">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default App
