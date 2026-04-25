'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getQuestionById, getVotesByQuestion, calcVoteStats, isExpired, formatCountdown, getProfile, getDemographicStats } from '@/lib/queries'
import { CATEGORY_EN } from '@/types'
import { Navbar } from '@/components/Navbar'
import { ResultBar } from '@/components/ResultBar'
import ShareModal from '@/components/ShareModal'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

function getEmotionalCopy(pctA: number, total: number): string {
  if (total < 3) return 'Waiting for more votes...'
  if (pctA >= 70) return 'Most people say YES — maybe this is your sign.'
  if (pctA <= 30) return 'The crowd says NO — think twice.'
  if (pctA > 50) return "More people lean YES, but it's close. Trust your gut."
  if (pctA < 50) return "More people lean NO, but the call is yours."
  return "It's 50/50. Flip a coin? Or trust yourself."
}

function ResultContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLang()
  const isEn = t('result.live') === 'Live'

  const [question, setQuestion] = useState<Question | null>(null)
  const [stats, setStats] = useState({ total: 0, a: 0, b: 0, pctA: 0, pctB: 0 })
  const [countdown, setCountdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [extending, setExtending] = useState(false)
  const [demographics, setDemographics] = useState<Awaited<ReturnType<typeof getDemographicStats>>>(null)

  const isCreated = searchParams.get('created') === 'true'

  const fetchData = useCallback(async () => {
    const { data: q, error: qErr } = await getQuestionById(id)
    if (qErr || !q) { setError('找不到這個問題'); setLoading(false); return }
    setQuestion(q)
    const { data: votes } = await getVotesByQuestion(id)
    setStats(calcVoteStats(votes ?? []))
    setLoading(false)
  }, [id])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      fetchData()
      setCurrentUserId(user.id)
      const { data: profile } = await getProfile(user.id)
      if (profile?.display_name) setDisplayName(profile.display_name)
      if (profile?.is_pro) {
        setIsPro(true)
        getDemographicStats(id).then(setDemographics)
      }
    })
  }, [router, fetchData])

  useEffect(() => {
    if (!question || isExpired(question.expires_at)) return
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [question, fetchData])

  useEffect(() => {
    if (!question) return
    const update = () => setCountdown(formatCountdown(question.expires_at))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [question])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-gray-400 mb-4">{error || '找不到問題'}</p>
          <Link href="/vote" className="btn-gradient px-6 py-3 rounded-2xl text-sm">Back to Vote</Link>
        </div>
      </div>
    )
  }

  const expired = isExpired(question.expires_at)
  const active = !expired && question.status === 'active'
  const isOwner = currentUserId === question.user_id
  const emotionalCopy = getEmotionalCopy(stats.pctA, stats.total)
  const voteUrl = typeof window !== 'undefined' ? `${window.location.origin}/result/${id}` : `https://votesnap.online/result/${id}`

  async function handleExtend() {
    if (extending) return
    setExtending(true)
    const res = await fetch('/api/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: id }),
    })
    if (res.ok) {
      const { expires_at } = await res.json()
      setQuestion(q => q ? { ...q, expires_at } : q)
    }
    setExtending(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto">
        {isCreated && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 text-center animate-slide-up">
            <p className="text-green-400 text-sm font-medium">{t('result.created')}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            active ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-gray-500'
          }`}>
            {active && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            {active ? t('result.live') : t('result.ended')}
          </span>
          {active && <span className="text-sm font-mono text-gray-400">{countdown} {t('result.left')}</span>}
          {question.category && (
            <span className="px-3 py-1 rounded-full text-xs bg-white/8 text-gray-400">{isEn ? (CATEGORY_EN[question.category!] ?? question.category) : question.category}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white leading-snug mb-8">{question.question_text}</h1>

        <div className="card p-6 mb-4 space-y-5">
          <ResultBar label={question.option_a} percent={stats.pctA} count={stats.a} isWinner={stats.pctA >= stats.pctB} gradient />
          <ResultBar label={question.option_b} percent={stats.pctB} count={stats.b} isWinner={stats.pctB > stats.pctA} />
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
            <span>{t('result.total', { n: stats.total })}</span>
            {active && <span className="text-gray-600">{t('result.updates')}</span>}
          </div>
        </div>

        <div className="bg-white/4 border border-white/6 rounded-2xl p-4 mb-6">
          <p className="text-gray-300 text-sm font-medium leading-relaxed">{emotionalCopy}</p>
        </div>

        {/* Demographic breakdown */}
        {isPro ? (
          demographics && (
            <div className="card p-5 mb-4">
              <p className="text-xs text-gray-500 font-medium mb-4 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded gradient-bg text-[10px] font-bold">PRO</span>
                {isEn ? 'Who voted what' : '投票人口分析'}
              </p>
              {[
                { label: isEn ? 'By age' : '年齡層', data: demographics.age },
                { label: isEn ? 'By gender' : '性別', data: demographics.gender },
              ].map(({ label, data }) => {
                const entries = Object.entries(data).filter(([, v]) => v.a + v.b > 0)
                if (entries.length === 0) return null
                return (
                  <div key={label} className="mb-4 last:mb-0">
                    <p className="text-xs text-gray-600 mb-2">{label}</p>
                    <div className="space-y-2">
                      {entries.sort(([a],[b]) => a.localeCompare(b)).map(([group, { a, b }]) => {
                        const total = a + b
                        const pctA = Math.round((a / total) * 100)
                        return (
                          <div key={group}>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{group}</span>
                              <span>{question!.option_a} {pctA}% · {question!.option_b} {100 - pctA}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                              <div className="h-full gradient-bg rounded-l-full" style={{ width: `${pctA}%` }} />
                              <div className="h-full bg-white/15 rounded-r-full" style={{ width: `${100 - pctA}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <div className="relative mb-4 overflow-hidden rounded-2xl">
            <div className="card p-5 select-none pointer-events-none" style={{ filter: 'blur(5px)', opacity: 0.5 }}>
              <p className="text-xs text-gray-500 mb-3">{isEn ? 'Who voted what' : '投票人口分析'}</p>
              {['18-24', '25-30', '31-40'].map(g => (
                <div key={g} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{g}</span><span>68% · 32%</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div className="h-full gradient-bg rounded-l-full" style={{ width: '68%' }} />
                    <div className="h-full bg-white/15 rounded-r-full" style={{ width: '32%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-[#0F0F0F]/90 border border-white/10 rounded-2xl px-5 py-4 text-center shadow-xl">
                <p className="text-sm font-semibold text-white mb-0.5">{isEn ? 'Pro Feature' : 'Pro 專屬'}</p>
                <p className="text-xs text-gray-400 mb-3">{isEn ? 'See who voted for what' : '查看各族群怎麼投票'}</p>
                <Link href="/pricing" className="btn-gradient px-5 py-2 rounded-xl text-xs font-medium">{isEn ? 'Upgrade →' : '升級 Pro →'}</Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/vote" className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-300 text-center text-sm hover:bg-white/5 transition-colors">
            {t('result.keepVoting')}
          </Link>
          <Link href="/ask" className="flex-1 btn-gradient py-3.5 rounded-2xl text-center text-sm">
            {t('result.askAnother')}
          </Link>
        </div>

        <button
          onClick={() => setShowShare(true)}
          className="w-full mt-3 py-3 rounded-2xl border border-white/8 text-gray-300 text-sm hover:bg-white/5 transition-colors"
        >
          分享結果
        </button>

        {/* QR Code */}
        <div className="mt-3">
          <button
            onClick={() => setShowQr(v => !v)}
            className="w-full py-3 rounded-2xl border border-white/8 text-gray-500 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <span>📱</span>
            <span>{isEn ? 'QR Code to share' : '掃描分享 QR Code'}</span>
            <span className="text-xs">{showQr ? '▲' : '▼'}</span>
          </button>
          {showQr && (
            <div className="mt-2 bg-white rounded-2xl p-4 flex flex-col items-center gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(voteUrl)}&bgcolor=ffffff&color=000000&margin=2`}
                alt="QR Code"
                className="w-40 h-40"
              />
              <p className="text-black/60 text-xs text-center break-all">{voteUrl}</p>
            </div>
          )}
        </div>

        {/* Extend time — Pro owner only */}
        {isPro && isOwner && active && (
          <button
            onClick={handleExtend}
            disabled={extending}
            className="w-full mt-3 py-3 rounded-2xl border border-violet-500/30 text-violet-400 text-sm hover:bg-violet-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>⏱</span>
            <span>{extending ? (isEn ? 'Extending...' : '延長中...') : (isEn ? 'Extend +30 min (Pro)' : '延長 30 分鐘 (Pro)')}</span>
          </button>
        )}
      </main>

      {showShare && question && (
        <ShareModal
          question={question.question_text}
          optionA={question.option_a}
          optionB={question.option_b}
          pctA={stats.pctA}
          pctB={stats.pctB}
          totalVotes={stats.total}
          displayName={displayName}
          resultUrl={typeof window !== 'undefined' ? window.location.href : ''}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
