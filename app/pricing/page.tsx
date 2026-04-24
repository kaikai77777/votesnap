'use client'

import Link from 'next/link'
import { Logo, LogoWordmark } from '@/components/Logo'
import { useLang } from '@/lib/i18n'

export default function PricingPage() {
  const { t } = useLang()

  const FREE_FEATURES = t('price.free') === 'Free'
    ? ['3 questions/day', 'Standard exposure', 'Basic result page', 'Google login']
    : ['每日 3 個問題', '標準曝光排序', '基本結果頁', 'Google 登入']

  const PRO_FEATURES = t('price.free') === 'Free'
    ? ['Unlimited questions', '2x vote exposure', 'Priority distribution', 'Demographic insights', 'Question pinning', 'Advanced sentiment analysis']
    : ['無限發問', '2x 投票曝光速度', '優先排隊分發', '詳細人口統計洞察', '問題置頂功能', '進階情緒分析']

  const FAQS = [
    { q: t('price.faq1q'), a: t('price.faq1a') },
    { q: t('price.faq2q'), a: t('price.faq2a') },
    { q: t('price.faq3q'), a: t('price.faq3a') },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <LogoWordmark className="text-xl" />
          </Link>
          <Link href="/login" className="btn-gradient px-5 py-2 text-sm">{t('land.cta1')}</Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="text-center mb-12 max-w-xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">{t('price.title')}</h1>
          <p className="text-gray-400">{t('price.sub')}</p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-8">
            <h2 className="text-xl font-bold mb-1">{t('price.free')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('price.freeSub')}</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold">$0</span>
              <span className="text-gray-500 text-sm ml-2">{t('price.month')}</span>
            </div>
            <Link href="/login" className="block w-full py-3.5 rounded-2xl border border-white/15 text-center text-white font-medium hover:bg-white/5 transition-colors mb-6">
              {t('price.startFree')}
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          <div className="gradient-border p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{t('price.pro')}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs gradient-bg font-medium">{t('price.comingSoon')}</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">{t('price.proSub')}</p>
              <div className="mb-6">
                <span className="text-5xl font-extrabold gradient-text">$9</span>
                <span className="text-gray-500 text-sm ml-2">{t('price.month')}</span>
              </div>
              <button disabled className="block w-full py-3.5 rounded-2xl gradient-bg text-center text-white font-medium opacity-60 cursor-not-allowed mb-6">
                {t('price.comingSoon')}
              </button>
              <ul className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="gradient-text font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">{t('price.faq')}</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <p className="text-white font-medium mb-2 text-sm">{q}</p>
                <p className="text-gray-500 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
