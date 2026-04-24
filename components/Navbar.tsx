'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo, LogoWordmark } from './Logo'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/vote', label: 'Vote' },
  { href: '/ask', label: 'Ask' },
  { href: '/my-questions', label: 'My Q\'s' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

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
          <Logo size={28} />
          <LogoWordmark className="text-lg" />
        </Link>

        <div className="flex items-center gap-1">
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
            className="ml-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Out
          </button>
        </div>
      </div>
    </nav>
  )
}
