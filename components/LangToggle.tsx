'use client'

import { useLang } from '@/lib/i18n'

export function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="hidden sm:flex fixed bottom-6 right-5 z-50 items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1A1A] border border-white/15 text-white text-sm font-semibold shadow-xl hover:bg-white/10 hover:border-white/25 transition-all active:scale-95"
    >
      <span className="text-base">🌐</span>
      {lang === 'zh' ? 'English' : '中文'}
    </button>
  )
}
