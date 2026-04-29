'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo'
import { useLang } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

interface PreviewCard {
  id: string
  text: string
  optA: string
  optB: string
  pctA: number
  pctB: number
  votes: number
}

const FALLBACK_CARDS: PreviewCard[] = [
  { id: '', text: '要不要主動傳訊息給他？', optA: 'Yes', optB: 'No', pctA: 74, pctB: 26, votes: 312 },
  { id: '', text: '這件衣服值得買嗎？', optA: 'Yes', optB: 'No', pctA: 58, pctB: 42, votes: 189 },
  { id: '', text: '消夜吃什麼？', optA: '麥當勞', optB: '豆漿店', pctA: 67, pctB: 33, votes: 201 },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return count
}

export default function LandingPage() {
  const { t, lang } = useLang()
  const [stats, setStats] = useState({ todayQs: 0, totalVotes: 0 })
  const [previewCards, setPreviewCards] = useState<PreviewCard[]>(FALLBACK_CARDS)

  const howSection = useInView(0.1)
  const ctaSection = useInView(0.2)
  const statsSection = useInView(0.3)

  const todayQsCount = useCountUp(statsSection.inView ? stats.todayQs : 0)
  const totalVotesCount = useCountUp(statsSection.inView ? stats.totalVotes : 0)

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

    fetch('/api/trending/preview')
      .then(r => r.json())
      .then((data: PreviewCard[]) => {
        if (Array.isArray(data) && data.length >= 3) setPreviewCards(data.slice(0, 3))
      })
      .catch(() => {})
  }, [])

  const HOW_IT_WORKS = [
    { step: '01', icon: '💬', title: t('land.s1t'), desc: t('land.s1d') },
    { step: '02', icon: '🗳️', title: t('land.s2t'), desc: t('land.s2d') },
    { step: '03', icon: '⚡', title: t('land.s3t'), desc: t('land.s3d') },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <LogoWordmark className="text-xl" />
          <div className="flex items-center gap-3">
            <Link href="/trending" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              {lang === 'zh' ? '排行榜' : 'Leaderboard'}
            </Link>
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              {lang === 'zh' ? '定價' : 'Pricing'}
            </Link>
            <Link href="/legal" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              {lang === 'zh' ? '法律' : 'Legal'}
            </Link>
            <Link href="/login" className="btn-gradient px-5 py-2 text-sm">
              {t('land.cta1')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-16 left-1/2 w-[700px] h-[500px] bg-violet-600/10 rounded-full blur-[130px] pointer-events-none animate-orb-slow" />
        <div className="absolute top-28 left-1/2 w-[380px] h-[380px] bg-fuchsia-500/12 rounded-full blur-[90px] pointer-events-none animate-orb-fast" />
        <div className="absolute top-48 left-[20%] w-[200px] h-[200px] bg-orange-500/8 rounded-full blur-[80px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-60 right-[15%] w-[160px] h-[160px] bg-pink-500/8 rounded-full blur-[70px] pointer-events-none animate-float" style={{ animationDelay: '3.5s' }} />

        {/* Noise grain overlay for depth */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

        <div className="relative max-w-3xl mx-auto">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {t('land.live')}
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            {t('land.h1a')}
            <br />
            <span className="gradient-text-animated">{t('land.h1b')}</span>
          </h1>

          <p
            className="text-base md:text-lg text-gray-500 mb-10 animate-fade-in-up"
            style={{ animationDelay: '180ms' }}
          >
            {t('land.sub2')}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up"
            style={{ animationDelay: '280ms' }}
          >
            <Link href="/login" className="btn-gradient px-8 py-4 text-base shadow-[0_0_40px_rgba(124,58,237,0.35)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] transition-shadow">
              {t('land.cta1')}
            </Link>
            <a
              href="#how"
              className="px-8 py-4 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 hover:border-white/25 transition-all text-base font-medium"
            >
              {t('land.cta2')}
            </a>
          </div>
        </div>

        {/* Live preview cards */}
        <div className="relative max-w-4xl mx-auto mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {previewCards.map((card, i) => {
            const inner = (
              <div
                className="card p-5 text-left h-full cursor-pointer group animate-fade-in-up"
                style={{
                  animationDelay: `${380 + i * 110}ms`,
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-6px)'
                  el.style.borderColor = 'rgba(124,58,237,0.25)'
                  el.style.boxShadow = '0 16px 40px rgba(124,58,237,0.15)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = ''
                  el.style.boxShadow = ''
                }}
              >
                <p className="text-white font-medium mb-4 text-sm leading-snug line-clamp-2">{card.text}</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="truncate pr-2">{card.optA}</span>
                      <span className="font-medium text-violet-400">{card.pctA}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-bg rounded-full"
                        style={{ width: `${card.pctA}%`, transition: 'width 1s ease 0.5s' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="truncate pr-2">{card.optB}</span>
                      <span>{card.pctB}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/20 rounded-full"
                        style={{ width: `${card.pctB}%`, transition: 'width 1s ease 0.6s' }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-3">{card.votes.toLocaleString()} votes</p>
              </div>
            )
            return card.id
              ? <Link key={i} href={`/result/${card.id}`}>{inner}</Link>
              : <div key={i}>{inner}</div>
          })}
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-float" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: '0.3s' }} />
        </div>
      </section>

      {/* ── Live stats ── */}
      <section ref={statsSection.ref} className="py-12 px-6">
        <div className="max-w-2xl mx-auto flex justify-center gap-4">
          <div
            className={`card p-6 text-center min-w-[130px] transition-all duration-700 ${statsSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(20,20,20,1))', borderColor: 'rgba(124,58,237,0.15)' }}
          >
            <p className="text-3xl font-bold gradient-text mb-1">{todayQsCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{t('land.stat1')}</p>
          </div>
          {stats.totalVotes >= 1000 && (
            <div
              className={`card p-6 text-center min-w-[130px] transition-all duration-700 delay-150 ${statsSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(20,20,20,1))', borderColor: 'rgba(236,72,153,0.15)' }}
            >
              <p className="text-3xl font-bold gradient-text mb-1">{totalVotesCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{t('land.stat2')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how" className="py-28 px-6">
        <div ref={howSection.ref} className="max-w-4xl mx-auto">
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-4 transition-all duration-700 ${howSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {t('land.how')}
          </h2>
          <p
            className={`text-gray-500 text-center mb-14 transition-all duration-700 ${howSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: '80ms' }}
          >
            {t('land.howSub')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon, title, desc }, i) => (
              <div
                key={step}
                className={`relative card p-7 transition-all duration-700 group cursor-default ${howSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{
                  transitionDelay: howSection.inView ? `${160 + i * 130}ms` : '0ms',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-6px)'
                  el.style.borderColor = 'rgba(124,58,237,0.3)'
                  el.style.boxShadow = '0 20px 50px rgba(124,58,237,0.12)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = ''
                  el.style.borderColor = ''
                  el.style.boxShadow = ''
                }}
              >
                {/* Step number glow */}
                <div className="absolute top-5 right-6 text-xs text-gray-700 font-mono font-bold tracking-widest">{step}</div>

                <div className="text-4xl mb-5 animate-float" style={{ animationDelay: `${i * 2.2}s`, display: 'inline-block' }}>
                  {icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>

                {/* Bottom gradient line on hover */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-violet-600/8 rounded-full blur-[120px] animate-orb-slow" style={{ transform: 'none' }} />
        </div>

        <div
          ref={ctaSection.ref}
          className={`max-w-xl mx-auto relative transition-all duration-1000 ${ctaSection.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
            {lang === 'zh' ? '免費開始' : 'Free to start'}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('land.startFree')}</h2>
          <p className="text-gray-400 mb-10 leading-relaxed">{t('land.freeSub')}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/login"
              className="btn-gradient px-8 py-3.5 text-base shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:shadow-[0_0_60px_rgba(124,58,237,0.5)] transition-shadow"
            >
              {t('land.startFree')}
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 hover:border-white/25 transition-all font-medium"
            >
              {t('land.seePricing')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <LogoWordmark className="text-base" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-2">
          <Link href="/about" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '關於' : 'About'}</Link>
          <Link href="/pricing" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '定價' : 'Pricing'}</Link>
          <Link href="/rules" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '社群規範' : 'Rules'}</Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '服務條款' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '隱私政策' : 'Privacy'}</Link>
          <Link href="/refund" className="hover:text-gray-400 transition-colors">{lang === 'zh' ? '退款政策' : 'Refund'}</Link>
        </div>
        <p>© 2025{new Date().getFullYear() > 2025 ? `–${new Date().getFullYear()}` : ''} votesnap.online</p>
      </footer>
    </div>
  )
}
