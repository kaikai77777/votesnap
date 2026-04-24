'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo, LogoWordmark } from './Logo'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLang()

  const NAV = [
    { href: '/vote', label: t('nav.vote') },
    { href: '/ask', label: t('nav.ask') },
    { href: '/my-questions', label: t('nav.myQ') },
    { href: '/pricing', label: '✦ Pro' },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/vote" className="flex items-center gap-2">
          <Logo size={40} />
          <LogoWordmark className="text-lg" />
        </Link>

        <div className="flex items-center gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                href === '/pricing'
                  ? 'gradient-bg text-white'
                  : pathname.startsWith(href)
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
      </div>
    </nav>
  )
}
