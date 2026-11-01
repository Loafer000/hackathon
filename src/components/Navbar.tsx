import React, { useState } from 'react'
import {
  Recycle,
  Mic,
  Languages,
  UserRound,
  Truck,
  Factory,
  Building2,
  ChevronDown,
  RotateCcw,
  WifiOff,
  Bell,
  Menu,
  X,
  FileSpreadsheet,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT, LANG_NAMES } from '../lib/i18n'
import { BrandLogo } from './BrandLogo'
import type { Role, Lang } from '../lib/types'

interface NavbarProps {
  onOpenVoice: () => void
  onOpenLogin: () => void
  onOpenMethod: () => void
  activeView: string
  setActiveView: (view: string) => void
}

export function Navbar({
  onOpenVoice,
  onOpenLogin,
  onOpenMethod,
  activeView,
  setActiveView,
}: NavbarProps) {
  const { session } = useApp()
  const { t, tr, lang } = useT()
  const [langMenu, setLangMenu] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const roleDetails: Record<Role, { title: string; icon: typeof UserRound; badgeBg: string }> = {
    generator: {
      title: session.userType === 'business' ? tr('Business Portal') : tr('Citizen Portal'),
      icon: UserRound,
      badgeBg: 'bg-[#e4eed5] text-[#365727]',
    },
    collector: {
      title: tr('Collector Portal'),
      icon: Truck,
      badgeBg: 'bg-[#dbeef0] text-[#1e5860]',
    },
    processor: {
      title: tr('Recycler / Facility'),
      icon: Factory,
      badgeBg: 'bg-[#faecd9] text-[#784d1c]',
    },
    admin: {
      title: tr('Ward Inspector'),
      icon: Building2,
      badgeBg: 'bg-[#ece8f7] text-[#4b377b]',
    },
  }

  const currentRole = roleDetails[session.role]
  const CurrentIcon = currentRole.icon

  function handleLogOut() {
    actions.updateSession({ onboarded: false })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#e2e6dc] bg-[#fafbf7]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6 py-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center text-left focus:outline-none"
          >
            <BrandLogo size="md" />
          </button>

          {/* Role badge button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold border border-[#d6ddd0] transition hover:shadow-xs ${currentRole.badgeBg}`}
          >
            <CurrentIcon size={14} />
            <span>{currentRole.title}</span>
            <ChevronDown size={13} className="opacity-70" />
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Voice Assistance Button */}
          <button
            type="button"
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#183f32] text-[#dff47d] text-xs font-extrabold shadow-xs transition hover:bg-[#103026]"
            title="Listen to segregation instructions in local language"
          >
            <Mic size={15} />
            <span className="hidden sm:inline">{tr('Voice Instructions')}</span>
          </button>

          {/* Methodology / Assumptions */}
          <button
            type="button"
            onClick={onOpenMethod}
            className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#d4dbce] bg-white text-xs font-bold text-[#455c4f] hover:bg-[#f1f5ec]"
            title="Transparent assumptions, mass-balance, and EPA factors"
          >
            <HelpCircle size={15} />
            <span>{tr('Methodology & Transparency')}</span>
          </button>

          {/* Language selector dropdown (Issue 2 & 3) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenu(!langMenu)}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-[#d4dbce] bg-white text-xs font-extrabold text-[#3a5245] hover:bg-[#f1f5ec]"
            >
              <Languages size={15} className="text-[#62776a]" />
              <span>{LANG_NAMES[lang]?.short || lang.toUpperCase()}</span>
              <ChevronDown size={13} className="text-[#62776a]" />
            </button>

            {langMenu && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl border border-[#d5ded0] bg-white p-1.5 shadow-xl z-50">
                {(['en', 'hi', 'mr', 'bn'] as Lang[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      actions.updateSession({ lang: code })
                      setLangMenu(false)
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-left ${
                      lang === code
                        ? 'bg-[#183f32] text-[#dff47d]'
                        : 'text-[#41594c] hover:bg-[#eef3e8]'
                    }`}
                  >
                    <span>{LANG_NAMES[code]?.native}</span>
                    <span className="text-[10px] opacity-70">{code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log Out / Switch Account */}
          <button
            type="button"
            onClick={handleLogOut}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#d4dbce] bg-white text-xs font-bold text-[#354f42] hover:bg-[#eef4e8]"
            title="Log Out or Switch Account"
          >
            <LogOut size={13} className="text-[#c35028]" />
            <span className="hidden sm:inline">{tr('Log Out / Switch')}</span>
          </button>

          {/* Mobile hamburger menu */}
          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden grid h-9 w-9 place-items-center rounded-xl border border-[#d4dbce] bg-white text-[#385244]"
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenu && (
        <div className="md:hidden border-t border-[#e2e6dc] bg-[#f7f9f3] p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#e1e6db]">
            <div className="text-xs font-extrabold text-[#526a5c]">
              {session.userName} ({currentRole.title})
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false)
                handleLogOut()
              }}
              className="text-xs font-extrabold text-[#c7552d]"
            >
              {tr('Log Out / Switch')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveView('home')
                setMobileMenu(false)
              }}
              className="p-2 rounded-lg bg-white border border-[#dce2d7] text-xs font-bold text-left text-[#264134]"
            >
              {tr('Workspace')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('report')
                setMobileMenu(false)
              }}
              className="p-2 rounded-lg bg-white border border-[#dce2d7] text-xs font-bold text-left text-[#264134]"
            >
              {tr('Report Waste')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('dashboard')
                setMobileMenu(false)
              }}
              className="p-2 rounded-lg bg-white border border-[#dce2d7] text-xs font-bold text-left text-[#264134]"
            >
              {tr('Metrics Dashboard')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('partners')
                setMobileMenu(false)
              }}
              className="p-2 rounded-lg bg-white border border-[#dce2d7] text-xs font-bold text-left text-[#264134]"
            >
              {tr('Verified Partners')}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
