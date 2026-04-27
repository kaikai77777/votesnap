'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo'
import { useLang } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

const EXAMPLE_CARDS = [
  { yes: 74, no: 26, votes: 312, zh: '要不要主動傳訊息給他？', en: 'Should I text first?', optA: 'Yes', optB: 'No' },
  { yes: 58, no: 42, votes: 189, zh: '這件衣服值得買嗎？', en: 'Is this worth buying?', optA: 'Yes', optB: 'No' },
  { yes: 67, no: 33, votes: 201, zh: '消夜吃什麼？', en: 'What to eat tonight?', optA: '麥當勞', optB: '豆漿店' },
]

export default function LandingPage() {
  const { t, lang } = useLang()
  const [stats, setStats] = useState({ todayQs: 0, totalVotes: 0 })

  useEffect(() => {
    const supabase = createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    Promise.all([
      supabase.from('questions').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
    ]).then(([qs, vs]) => {
      setStats({ todayQs: qs.count ?? 0, totalVotes: vs.count ?? 0 })
    })
  }, [])

  const HOW_IT_WORKS = [
    { step: '01', icon: '💬', title: t('land.s1t'), desc: t('land.s1d') },
    { step: '02', icon: '🗳️', title: t('land.s2t'), desc: t('land.s2d') },
    { step: '03', icon: '⚡', title: t('land.s3t'), desc: t('land.s3d') },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <LogoWordmark className="text-xl" />
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              {lang === 'zh' ? '定價' : 'Pricing'}
            </Link>
            <Link href="/login" className="btn-gradient px-5 py-2 text-sm">
              {t('land.cta1')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {t('land.live')}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-6">
            {t('land.h1a')}
            <br />
            <span className="gradient-text">{t('land.h1b')}</span>
          </h1>

          <p className="text-base text-gray-500 mb-10">{t('land.sub2')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-gradient px-8 py-4 text-base">{t('land.cta1')}</Link>
            <a href="#how" className="px-8 py-4 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 transition-colors text-base font-medium">
              {t('land.cta2')}
            </a>
          </div>
        </div>

        {/* Example cards */}
        <div className="relative max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EXAMPLE_CARDS.map((card, i) => (
            <div key={i} className="card p-5 text-left hover:border-white/12 transition-colors">
              <p className="text-white font-medium mb-4 text-sm">{lang === 'zh' ? card.zh : card.en}</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{card.optA}</span><span>{card.yes}%</span></div>
                  <div className="h-1.5 bg-white/5 rounded-full"><div className="h-full gradient-bg rounded-full" style={{ width: `${card.yes}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{card.optB}</span><span>{card.no}%</span></div>
                  <div className="h-1.5 bg-white/5 rounded-full"><div className="h-full bg-white/20 rounded-full" style={{ width: `${card.no}%` }} /></div>
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-3">{card.votes} votes</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live stats */}
      <section className="py-10 px-6">
        <div className="max-w-2xl mx-auto flex justify-center gap-4">
          <div className="card p-5 text-center min-w-[120px]">
            <p className="text-2xl font-bold gradient-text mb-1">{stats.todayQs.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{t('land.stat1')}</p>
          </div>
          {stats.totalVotes >= 1000 && (
            <div className="card p-5 text-center min-w-[120px]">
              <p className="text-2xl font-bold gradient-text mb-1">{stats.totalVotes.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{t('land.stat2')}</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t('land.how')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('land.howSub')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div key={step} className="card p-6">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-xs text-gray-600 font-mono mb-2">{step}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">{t('land.startFree')}</h2>
          <p className="text-gray-400 mb-8">{t('land.freeSub')}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="btn-gradient px-8 py-3">{t('land.startFree')}</Link>
            <Link href="/pricing" className="px-8 py-3 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 transition-colors font-medium">
              {t('land.seePricing')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <LogoWordmark className="text-base" />
        </div>
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/rules" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '社群規範' : 'Rules'}</Link>
          <Link href="/pricing" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '定價' : 'Pricing'}</Link>
        </div>
        <p>© 2025{new Date().getFullYear() > 2025 ? `–${new Date().getFullYear()}` : ''} votesnap.online</p>
      </footer>
    </div>
  )
}
