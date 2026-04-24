'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function PricingPage() {
  const { t } = useLang()

  const isEn = t('price.free') === 'Free'

  const FREE_FEATURES = isEn
    ? ['3 questions/day', 'Standard exposure', 'Basic result page', 'Google login']
    : ['每日 3 個問題', '標準曝光排序', '基本結果頁', 'Google 登入']

  const PRO_FEATURES = isEn
    ? ['Unlimited questions/day', '2× vote exposure', 'Priority distribution', 'Demographic breakdown', 'Question pinning']
    : ['每日無限發問', '2× 投票曝光速度', '優先分發排序', '詳細人口統計', '問題置頂']

  const FAQS = [
    { q: t('price.faq1q'), a: t('price.faq1a') },
    { q: t('price.faq2q'), a: t('price.faq2a') },
    { q: t('price.faq3q'), a: t('price.faq3a') },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="text-center mb-12 max-w-xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">{t('price.title')}</h1>
          <p className="text-gray-400">{t('price.sub')}</p>
        </div>

        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="card p-8">
            <h2 className="text-xl font-bold mb-1">{t('price.free')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('price.freeSub')}</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold">$0</span>
              <span className="text-gray-500 text-sm ml-2">{t('price.month')}</span>
            </div>
            <Link href="/vote" className="block w-full py-3.5 rounded-2xl border border-white/15 text-center text-white font-medium hover:bg-white/5 transition-colors mb-6">
              {isEn ? 'Current plan' : '目前方案'}
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl overflow-hidden p-[1px]" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
            <div className="bg-[#0F0F0F] rounded-2xl p-8 h-full relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{t('price.pro')}</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs gradient-bg font-medium">{t('price.comingSoon')}</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">{t('price.proSub')}</p>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold gradient-text">$4</span>
                  <span className="text-gray-500 text-sm ml-2">{t('price.month')}</span>
                </div>
                <button
                  disabled
                  className="w-full py-3.5 rounded-2xl gradient-bg text-center text-white font-medium opacity-50 cursor-not-allowed mb-6"
                >
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
        </div>

        <div className="max-w-xl mx-auto mt-16">
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
