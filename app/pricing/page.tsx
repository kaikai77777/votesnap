'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

function PricingContent() {
  const { t } = useLang()
  const searchParams = useSearchParams()
  const isEn = t('price.free') === 'Free'

  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(false)

  const success = searchParams.get('success') === 'true'
  const cancelled = searchParams.get('cancelled') === 'true'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setLoggedIn(true)
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
      setIsPro(data?.is_pro ?? false)
      setLoading(false)
    })
  }, [])

  async function handleCheckout() {
    if (checking) return
    setChecking(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Checkout failed')
      setChecking(false)
    }
  }

  const FREE_FEATURES = isEn
    ? ['5 questions/day', 'Voting history', 'Basic result page', 'Anonymous voting support']
    : ['每日 5 個問題', '投票紀錄', '基本結果頁', '支援匿名投票']

  const PRO_FEATURES = isEn
    ? [
        'Unlimited questions (free: 5/day)',
        'Demographic breakdown (age & gender)',
        'Custom poll duration: 5 min – 7 days',
        'Extend poll time +30 min',
        'Priority feed exposure + Pro badge',
      ]
    : [
        '無限發問（免費版每日 5 題）',
        '投票者人口統計（年齡、性別分析）',
        '自訂投票時效（5 分鐘 ～ 7 天任意設定）',
        '延長投票時間 +30 分鐘',
        '優先曝光排序 + Pro 徽章',
      ]

  const FAQS = [
    { q: t('price.faq1q'), a: t('price.faq1a') },
    { q: t('price.faq2q'), a: t('price.faq2a') },
    { q: t('price.faq3q'), a: t('price.faq3a') },
  ]

  // Already Pro
  if (!loading && isPro) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <Navbar />
        <main className="pt-24 pb-20 px-4 max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">✦</div>
            <h1 className="text-3xl font-extrabold gradient-text mb-2">Pro 會員</h1>
            <p className="text-gray-500 text-sm">{isEn ? 'You have lifetime Pro access' : '您已擁有永久 Pro 資格'}</p>
          </div>

          <div className="card p-6 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{isEn ? 'Status' : '狀態'}</span>
              <span className="text-green-400 font-medium">{isEn ? '● Active' : '● 已啟用'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{isEn ? 'Plan' : '方案'}</span>
              <span className="text-white">Pro · {isEn ? 'One-time $4' : '一次買斷 $4'}</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="gradient-text font-bold">✓</span>{f}
              </li>
            ))}
          </ul>

          <Link href="/vote" className="block w-full py-3.5 rounded-2xl gradient-bg text-center text-white font-medium">
            {isEn ? '← Back to Vote' : '← 回到投票'}
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">

        {/* Success banner */}
        {success && (
          <div className="max-w-2xl mx-auto mb-8 px-5 py-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center animate-slide-up">
            <p className="text-green-400 font-medium text-sm">
              {isEn ? '🎉 Payment successful! Your Pro access is now active.' : '🎉 付款成功！Pro 功能已立即開啟。'}
            </p>
          </div>
        )}
        {cancelled && (
          <div className="max-w-2xl mx-auto mb-8 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              {isEn ? 'Payment cancelled. Your plan was not changed.' : '已取消付款，方案未變更。'}
            </p>
          </div>
        )}

        <div className="text-center mb-12 max-w-xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">
            {isEn ? 'Upgrade to ' : '升級 '}
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="text-gray-400">{t('price.sub')}</p>
        </div>

        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="card p-8">
            <h2 className="text-xl font-bold mb-1">{t('price.free')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('price.freeSub')}</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold">$0</span>
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
                  <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300 font-medium border border-violet-500/20">
                    {isEn ? 'One-time' : '買斷'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-6">{t('price.proSub')}</p>
                <div className="mb-2">
                  <span className="text-5xl font-extrabold gradient-text">$4</span>
                  <span className="text-gray-500 text-sm ml-2">{isEn ? 'one-time' : '永久使用'}</span>
                </div>
                <p className="text-xs text-gray-600 mb-6">{isEn ? 'Pay once, use forever.' : '付一次，永久享有 Pro 功能。'}</p>

                {loggedIn ? (
                  <button
                    onClick={handleCheckout}
                    disabled={checking}
                    className="w-full py-3.5 rounded-2xl gradient-bg text-center text-white font-medium mb-6 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {checking
                      ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{isEn ? 'Redirecting...' : '跳轉中...'}</>
                      : (isEn ? 'Upgrade to Pro →' : '立即升級 Pro →')
                    }
                  </button>
                ) : (
                  <Link href="/login" className="block w-full py-3.5 rounded-2xl gradient-bg text-center text-white font-medium mb-6 hover:opacity-90 transition-opacity">
                    {isEn ? 'Login to upgrade →' : '登入後升級 →'}
                  </Link>
                )}

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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
