'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getQuestionById, getVotesByQuestion, calcVoteStats, isExpired, formatCountdown, getProfile, getDemographicStats, getReactions, addReaction, removeReaction } from '@/lib/queries'
import { CATEGORY_EN } from '@/types'
import { Navbar } from '@/components/Navbar'
import { ResultBar } from '@/components/ResultBar'
import ShareModal from '@/components/ShareModal'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

const EMOJIS = ['🤣', '😱', '❤️', '🤔', '👀']

function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('votesnap_anon_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('votesnap_anon_id', id) }
  return id
}

function getEmotionalCopy(pctA: number, total: number): string {
  if (total < 3) return 'Waiting for more votes...'
  if (pctA >= 70) return 'Most people say YES — maybe this is your sign.'
  if (pctA <= 30) return 'The crowd says NO — think twice.'
  if (pctA > 50) return "More people lean YES, but it's close. Trust your gut."
  if (pctA < 50) return "More people lean NO, but the call is yours."
  return "It's 50/50. Flip a coin? Or trust yourself."
}

type Stats = { total: number; a: number; b: number; c: number; d: number; pctA: number; pctB: number; pctC: number; pctD: number }

function ResultContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { t } = useLang()
  const isEn = t('result.live') === 'Live'

  const [question, setQuestion] = useState<Question | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, a: 0, b: 0, c: 0, d: 0, pctA: 0, pctB: 0, pctC: 0, pctD: 0 })
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
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set())
  const [anonId, setAnonId] = useState<string>('')

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
    const anon = getAnonymousId()
    setAnonId(anon)

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      fetchData()
      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await getProfile(user.id)
        if (profile?.display_name) setDisplayName(profile.display_name)
        if (profile?.is_pro) {
          setIsPro(true)
          getDemographicStats(id).then(setDemographics)
        }
      }
      // Load reactions
      const { data: rxData } = await getReactions(id)
      if (rxData) {
        const counts: Record<string, number> = {}
        rxData.forEach(r => { counts[r.emoji] = (counts[r.emoji] ?? 0) + 1 })
        setReactions(counts)
        const uid = user?.id ?? null
        const myRx = new Set(rxData
          .filter(r => (uid && r.user_id === uid) || (!uid && r.anonymous_id === anon))
          .map(r => r.emoji))
        setMyReactions(myRx)
      }
    })
  }, [fetchData, id])

  useEffect(() => {
    if (!question || isExpired(question.expires_at)) return
    const supabase = createClient()
    const channel = supabase
      .channel(`votes-${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `question_id=eq.${id}` },
        (payload) => {
          const vote = (payload.new as { vote: string }).vote
          setStats(prev => {
            const a = prev.a + (vote === 'A' ? 1 : 0)
            const b = prev.b + (vote === 'B' ? 1 : 0)
            const c = prev.c + (vote === 'C' ? 1 : 0)
            const d = prev.d + (vote === 'D' ? 1 : 0)
            const total = a + b + c + d
            if (total === 0) return prev
            return { total, a, b, c, d, pctA: Math.round((a/total)*100), pctB: Math.round((b/total)*100), pctC: Math.round((c/total)*100), pctD: Math.round((d/total)*100) }
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [question, id])

  useEffect(() => {
    if (!question) return
    const update = () => setCountdown(formatCountdown(question.expires_at))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [question])

  async function handleReaction(emoji: string) {
    const has = myReactions.has(emoji)
    if (has) {
      await removeReaction(id, emoji, currentUserId, currentUserId ? null : anonId)
      setMyReactions(prev => { const next = new Set(prev); next.delete(emoji); return next })
      setReactions(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }))
    } else {
      const { error: rxErr } = await addReaction(id, emoji, currentUserId, currentUserId ? null : anonId)
      if (!rxErr) {
        setMyReactions(prev => new Set([...prev, emoji]))
        setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }))
      }
    }
  }

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

  const optionBars = [
    { key: 'A', label: question.option_a, pct: stats.pctA, count: stats.a },
    { key: 'B', label: question.option_b, pct: stats.pctB, count: stats.b },
    ...(question.option_c ? [{ key: 'C', label: question.option_c, pct: stats.pctC, count: stats.c }] : []),
    ...(question.option_d ? [{ key: 'D', label: question.option_d, pct: stats.pctD, count: stats.d }] : []),
  ]
  const winnerPct = Math.max(...optionBars.map(o => o.pct))

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
          {optionBars.map((opt, i) => (
            <ResultBar
              key={opt.key}
              label={opt.label}
              percent={opt.pct}
              count={opt.count}
              isWinner={opt.pct === winnerPct && winnerPct > 0}
              gradient={i === 0}
            />
          ))}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
            <span>{t('result.total', { n: stats.total })}</span>
            {active && <span className="text-gray-600">{t('result.updates')}</span>}
          </div>
        </div>

        {/* Emoji reactions */}
        <div className="flex gap-2 justify-center mb-4">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border transition-all ${
                myReactions.has(emoji)
                  ? 'bg-white/10 border-white/25 scale-105'
                  : 'border-white/8 text-gray-400 hover:bg-white/5'
              }`}
            >
              <span className="text-xl leading-none">{emoji}</span>
              {(reactions[emoji] ?? 0) > 0 && <span className="text-[10px] text-gray-400 leading-none">{reactions[emoji]}</span>}
            </button>
          ))}
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
          {currentUserId ? (
            <Link href="/ask" className="flex-1 btn-gradient py-3.5 rounded-2xl text-center text-sm">
              {t('result.askAnother')}
            </Link>
          ) : (
            <Link href="/login" className="flex-1 btn-gradient py-3.5 rounded-2xl text-center text-sm">
              {isEn ? 'Login to ask' : '登入後發問'}
            </Link>
          )}
        </div>

        {isOwner && (
          <button
            onClick={() => setShowShare(true)}
            className="w-full mt-3 py-3 rounded-2xl border border-white/8 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            分享結果
          </button>
        )}

        {isOwner && <div className="mt-3">
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
        </div>}

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
