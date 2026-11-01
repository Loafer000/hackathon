import React from 'react'
import { useT } from '../lib/i18n'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  inverted?: boolean
}

export function BrandLogo({ size = 'md', showText = true, className = '', inverted = false }: BrandLogoProps) {
  const { tr, lang } = useT()

  const dimensions = {
    sm: { icon: 32, box: 'h-8 w-8', text: 'text-sm', sub: 'text-[8px]' },
    md: { icon: 40, box: 'h-10 w-10', text: 'text-lg', sub: 'text-[9px]' },
    lg: { icon: 52, box: 'h-13 w-13', text: 'text-2xl', sub: 'text-[11px]' },
  }[size]

  // Native script names for the brand
  const brandName = lang === 'hi' || lang === 'mr' ? 'आवर्तन' : lang === 'bn' ? 'আবর্তন' : 'Avartan'
  const brandSub = lang === 'hi' ? 'स्थानीय चक्रीय कचरा व संसाधन नेटवर्क'
    : lang === 'mr' ? 'स्थानिक चक्रीय कचरा व संसाधन ग्रिड'
    : lang === 'bn' ? 'স্থানীয় সার্কুলার বর্জ্য ও রিসোর্স গ্রিড'
    : 'Local Circular Waste & Resource Grid'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Bespoke Geometric Trinity Infinity Loop Icon */}
      <div
        className={`${dimensions.box} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 ${
          inverted ? 'bg-white text-[#173f32]' : 'bg-[#173f32] text-[#dff47d]'
        }`}
      >
        <svg
          width={dimensions.icon * 0.65}
          height={dimensions.icon * 0.65}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Continuous interlocking Möbius loop symbolizing Citizen -> Collector -> Recycler */}
          <path
            d="M18 4C10.268 4 4 10.268 4 18C4 21.866 5.567 25.366 8.1 27.9L10.928 25.072C9.11 23.254 8 20.754 8 18C8 12.477 12.477 8 18 8C20.754 8 23.254 9.11 25.072 10.928L27.9 8.1C25.366 5.567 21.866 4 18 4Z"
            fill={inverted ? '#173f32' : '#dff47d'}
          />
          <path
            d="M32 18C32 14.134 30.433 10.634 27.9 8.1L25.072 10.928C26.89 12.746 28 15.246 28 18C28 23.523 23.523 28 18 28C15.246 28 12.746 26.89 10.928 25.072L8.1 27.9C10.634 30.433 14.134 32 18 32C25.732 32 32 25.732 32 18Z"
            fill={inverted ? '#e36338' : '#e36338'}
          />
          {/* Center node: Traceable circular core */}
          <circle cx="18" cy="18" r="4" fill={inverted ? '#173f32' : '#dff47d'} />
          <circle cx="18" cy="18" r="2" fill={inverted ? '#ffffff' : '#173f32'} />
        </svg>
      </div>

      {showText && (
        <div className="text-left leading-none">
          <div
            className={`font-display font-extrabold tracking-tight flex items-baseline gap-1.5 ${dimensions.text} ${
              inverted ? 'text-white' : 'text-[#163c30]'
            }`}
          >
            <span>{brandName}</span>
            {lang !== 'en' && (
              <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${inverted ? 'text-white/70' : 'text-[#587364]'}`}>
                (Avartan)
              </span>
            )}
          </div>
          <div
            className={`font-sans font-bold uppercase tracking-widest mt-1 truncate max-w-[240px] sm:max-w-none ${dimensions.sub} ${
              inverted ? 'text-white/80' : 'text-[#667a6e]'
            }`}
          >
            {brandSub}
          </div>
        </div>
      )}
    </div>
  )
}
