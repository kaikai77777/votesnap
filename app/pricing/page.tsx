'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function PricingPage() {
  const { t } = useLang()
  const router = useRouter()
  const isEn = t('price.free') === 'Free'

  const [isPro, setIsPro] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('is_pro, pro_expires_at').eq('id', user.id).single()
      setIsPro(data?.is_pro ?? false)
      setExpiresAt(data?.pro_expires_at ?? null)
    })
  }, [])

  async function handleCancel() {
    setCancelling(true)
    await fetch('/api/cancel-pro', { method: 'POST' })
    setDone(true)
    setCancelling(false)
    setTimeout(() => router.push('/vote'), 2000)
  }

  const FREE_FEATURES = isEn
    ? ['5 questions/day', 'Voting history', 'Basic result page', 'Anonymous voting support']
    : ['每日 5 個問題', '投票紀錄', '基本結果頁', '支援匿名投票']

  const PRO_FEATURES = isEn
    ? [
        'Unlimited questions (free: 5/day)',
        'Demographic breakdown (age & gender)',
        'AI result insights (auto-generated)',
        'Long-term polls: 3/7/30 days',
        'Extend poll time +30 min',
        'Priority feed exposure + Pro badge',
      ]
    : [
        '無限發問（免費版每日 5 題）',
        '投票者人口統計（年齡、性別分析）',
        'AI 結果洞察（每題自動生成）',
        '長期投票時效（3天 / 7天 / 30天）',
        '延長投票時間 +30 分鐘',
        '優先曝光排序 + Pro 徽章',
      ]

  const FAQS = [
    { q: t('price.faq1q'), a: t('price.faq1a') },
    { q: t('price.faq2q'), a: t('price.faq2a') },
    { q: t('price.faq3q'), a: t('price.faq3a') },
  ]

  if (isPro) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <Navbar />
        <main className="pt-24 pb-20 px-4 max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">✦</div>
            <h1 className="text-3xl font-extrabold gradient-text mb-2">Pro 會員</h1>
            <p className="text-gray-500 text-sm">{isEn ? 'Your subscription is active' : '您的訂閱目前有效'}</p>
          </div>

          <div className="card p-6 mb-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{isEn ? 'Status' : '狀態'}</span>
              <span className="text-green-400 font-medium">{isEn ? '● Active' : '● 訂閱中'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{isEn ? 'Plan' : '方案'}</span>
              <span className="text-white">Pro · $4 / {isEn ? 'month' : '月'}</span>
            </div>
            {expiresAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isEn ? 'Renews / Expires' : '到期日'}</span>
                <span className="text-white">
                  {new Date(expiresAt).toLocaleDateString(isEn ? 'en-US' : 'zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {done ? (
            <div className="text-center py-6 text-green-400 font-medium">
              {isEn ? '✓ Cancelled. Redirecting...' : '✓ 已取消，正在跳轉...'}
            </div>
          ) : showConfirm ? (
            <div className="card p-5 border border-red-500/20">
              <p className="text-sm text-gray-300 mb-1 font-medium">{isEn ? 'Cancel subscription?' : '確定要取消訂閱？'}</p>
              <p className="text-xs text-gray-500 mb-4">{isEn ? 'No refunds will be issued. Your Pro access ends immediately.' : '取消後不予退款，Pro 功能將立即停用。'}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:bg-white/5">
                  {isEn ? 'Keep Pro' : '保留訂閱'}
                </button>
                <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-2.5 rounded-xl text-sm bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50">
                  {cancelling ? (isEn ? 'Cancelling...' : '取消中...') : (isEn ? 'Confirm Cancel' : '確認取消')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowConfirm(true)} className="w-full py-3 rounded-2xl border border-white/8 text-gray-500 text-sm hover:text-red-400 hover:border-red-500/30 transition-colors">
              {isEn ? 'Cancel subscription' : '取消訂閱'}
            </button>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
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
