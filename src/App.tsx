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
  WifiOff,
  RotateCcw,
  Recycle,
  Mic,
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
  const { t } = useT()

  // Navigation view state
  const [activeView, setActiveView] = useState<string>('home')
  const [traceId, setTraceId] = useState<string | undefined>(undefined)

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [voiceCategory, setVoiceCategory] = useState<CategoryId | undefined>(undefined)
  const [loginModalOpen, setLoginModalOpen] = useState(!session.onboarded)
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
    showToast('Sample dataset restored with consistent mass balance audit trail.')
  }

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
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 space-y-1 self-start sticky top-20">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#728579] px-3 pb-2">
            Navigation
          </div>

          <button
            onClick={() => setActiveView('home')}
            className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
              activeView === 'home'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:bg-[#e9eee2]'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveView('report')}
            className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
              activeView === 'report'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:bg-[#e9eee2]'
            }`}
          >
            <PlusCircle size={16} />
            <span>Report Waste</span>
          </button>

          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
              activeView === 'dashboard'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:bg-[#e9eee2]'
            }`}
          >
            <Recycle size={16} />
            <span>Metrics Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('guide')}
            className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
              activeView === 'guide'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:bg-[#e9eee2]'
            }`}
          >
            <BookOpen size={16} />
            <span>Segregation Guide</span>
          </button>

          <button
            onClick={() => setActiveView('partners')}
            className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
              activeView === 'partners'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:bg-[#e9eee2]'
            }`}
          >
            <Handshake size={16} />
            <span>Verified Partners</span>
          </button>

          <button
            onClick={() => {
              setTraceId(undefined)
              setActiveView('trace')
            }}
            className={`flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-xs font-extrabold transition text-left ${
              activeView === 'trace'
                ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                : 'text-[#486053] hover:bg-[#e9eee2]'
            }`}
          >
            <Route size={16} />
            <span>Trace Material</span>
          </button>

          {/* Quick role-specific button */}
          <div className="pt-4 border-t border-[#e2e6dc] space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#728579] px-3">
              Interface Role
            </div>

            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center justify-between w-full p-2.5 rounded-xl border border-[#d6ddd0] bg-white text-left hover:bg-[#f2f6ee] text-xs font-bold text-[#2e473a]"
            >
              <div className="flex items-center gap-2">
                <span className="capitalize">{session.role}</span>
              </div>
              <span className="text-[10px] text-[#4f7035] font-extrabold uppercase">Switch</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] font-bold text-[#6a7d72] hover:text-[#183f32]"
              title="Reset sample dataset"
            >
              <RotateCcw size={13} />
              <span>Reset Sample Data</span>
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
          ) : activeView === 'dashboard' ? (
            <DashboardView />
          ) : activeView === 'guide' ? (
            <SegregationGuideView onOpenVoiceCategory={handleOpenVoice} />
          ) : activeView === 'partners' ? (
            <PartnersDirectory />
          ) : activeView === 'trace' ? (
            <TraceView initialId={traceId} />
          ) : (
            // Default Home View: Role tailored
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-2 bottom-2 z-40 md:hidden grid grid-cols-5 rounded-2xl border border-[#d4dbce] bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold ${
            activeView === 'home' ? 'bg-[#183f32] text-[#dff47d]' : 'text-[#64796e]'
          }`}
        >
          <LayoutDashboard size={17} />
          <span className="mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveView('report')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold ${
            activeView === 'report' ? 'bg-[#183f32] text-[#dff47d]' : 'text-[#64796e]'
          }`}
        >
          <PlusCircle size={17} />
          <span className="mt-0.5">Report</span>
        </button>

        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold ${
            activeView === 'dashboard' ? 'bg-[#183f32] text-[#dff47d]' : 'text-[#64796e]'
          }`}
        >
          <Recycle size={17} />
          <span className="mt-0.5">Metrics</span>
        </button>

        <button
          onClick={() => setActiveView('partners')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold ${
            activeView === 'partners' ? 'bg-[#183f32] text-[#dff47d]' : 'text-[#64796e]'
          }`}
        >
          <Handshake size={17} />
          <span className="mt-0.5">Network</span>
        </button>

        <button
          onClick={() => handleOpenVoice()}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[9px] font-extrabold text-[#295620] bg-[#eef7e6]"
        >
          <Mic size={17} />
          <span className="mt-0.5">Voice</span>
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
