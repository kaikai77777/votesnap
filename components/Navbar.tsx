'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogoWordmark } from './Logo'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'


export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, toggle } = useLang()
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
      setIsPro(data?.is_pro ?? false)
    })
  }, [])

  const isEn = t('nav.vote') === 'Vote'
  const NAV = [
    { href: '/vote',         label: t('nav.vote'),             icon: '🗳️' },
    { href: '/ask',          label: t('nav.ask'),              icon: '✏️' },
    { href: '/trending',     label: isEn ? 'Hot' : '熱榜',    icon: '🔥' },
    { href: '/my-questions', label: t('nav.myQ'),              icon: '📋' },
    { href: '/settings',     label: isEn ? 'Profile' : '設定', icon: '⚙️' },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/vote" className="flex items-center gap-2">
            <LogoWordmark className="text-lg" />
            {isPro && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold gradient-bg leading-none">PRO</span>}
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="ml-1 px-3 py-1.5 rounded-full text-sm font-medium bg-white/8 text-gray-400 hover:bg-red-500/20 hover:text-red-400 border border-white/8 transition-colors"
            >
              {t('nav.signOut')}
            </button>
          </div>

          {/* Mobile: lang toggle + sign out */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/8 text-gray-400 border border-white/8 transition-colors hover:bg-white/12"
            >
              🌐 {lang === 'zh' ? 'EN' : '中'}
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/8 text-gray-500 hover:bg-red-500/20 hover:text-red-400 border border-white/8 transition-colors"
            >
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/8">
        <div className="flex items-stretch h-16">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-white' : 'text-gray-600'}`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] font-medium">{label}</span>
                {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile bottom nav spacer */}
      <div className="sm:hidden h-16" style={{ position: 'fixed', bottom: 0, pointerEvents: 'none' }} />
    </>
  )
}
