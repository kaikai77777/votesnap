'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getQuestionById, getVotesByQuestion, calcVoteStats, isExpired, formatCountdown } from '@/lib/queries'
import { CATEGORY_EN } from '@/types'
import { Navbar } from '@/components/Navbar'
import { ResultBar } from '@/components/ResultBar'
import { ShareModal } from '@/components/ShareModal'
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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.replace('/login')
      fetchData()
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
  const emotionalCopy = getEmotionalCopy(stats.pctA, stats.total)

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
      </main>

      {showShare && question && (
        <ShareModal
          question={question.question_text}
          optionA={question.option_a}
          optionB={question.option_b}
          pctA={stats.pctA}
          pctB={stats.pctB}
          totalVotes={stats.total}
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
