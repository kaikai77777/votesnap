'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserQuestions, calcVoteStats, isExpired, getProfile } from '@/lib/queries'
import { CATEGORY_EN } from '@/types'
import { Navbar } from '@/components/Navbar'
import ShareModal from '@/components/ShareModal'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

interface QuestionWithStats extends Question {
  pctA: number
  pctB: number
  total: number
}

interface VotedQuestion extends QuestionWithStats {
  myVote: 'A' | 'B'
}

const TZ = 'Asia/Taipei'
const toTaipeiDateStr = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
const todayTaipei = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ })
const formatTimeTaipei = (iso: string) =>
  new Date(iso).toLocaleTimeString('zh-TW', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

function catLabel(cat: string | null, isEn: boolean) {
  if (!cat) return null
  if (isEn) return CATEGORY_EN[cat] ?? cat
  return cat
}

export default function MyQuestionsPage() {
  const router = useRouter()
  const { t } = useLang()
  const isEn = t('myq.title') === 'My Questions'

  const [tab, setTab] = useState<'asked' | 'voted'>('asked')
  const [questions, setQuestions] = useState<QuestionWithStats[]>([])
  const [votedQuestions, setVotedQuestions] = useState<VotedQuestion[]>([])
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [shareQ, setShareQ] = useState<QuestionWithStats | null>(null)

  const today = todayTaipei()
  const [viewYear, setViewYear] = useState(() => parseInt(today.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(today.slice(5, 7)) - 1)
  const [selectedDate, setSelectedDate] = useState<string>(today)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')

      // Pro status + display name
      const { data: profile } = await supabase.from('profiles').select('is_pro, display_name').eq('id', user.id).single()
      setIsPro(profile?.is_pro ?? false)
      if (profile?.display_name) setDisplayName(profile.display_name)

      // Asked questions
      const { data: qs } = await getUserQuestions(user.id)
      if (qs) {
        const withStats = await Promise.all(
          qs.map(async (q) => {
            const { data: votes } = await supabase.from('votes').select('vote').eq('question_id', q.id)
            const stats = calcVoteStats(votes ?? [])
            return { ...q, pctA: stats.pctA, pctB: stats.pctB, total: stats.total }
          })
        )
        setQuestions(withStats)
      }

      // Voted questions
      const { data: myVotes } = await supabase
        .from('votes')
        .select('question_id, vote')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (myVotes && myVotes.length > 0) {
        const qIds = myVotes.map((v) => v.question_id)
        const { data: vqs } = await supabase.from('questions').select('*').in('id', qIds)
        if (vqs) {
          const withStats = await Promise.all(
            vqs.map(async (q) => {
              const { data: votes } = await supabase.from('votes').select('vote').eq('question_id', q.id)
              const stats = calcVoteStats(votes ?? [])
              const myVote = myVotes.find((v) => v.question_id === q.id)?.vote as 'A' | 'B'
              return { ...q, pctA: stats.pctA, pctB: stats.pctB, total: stats.total, myVote }
            })
          )
          // Sort newest vote first
          const sorted = withStats.sort((a, b) => {
            const ai = myVotes.findIndex((v) => v.question_id === a.id)
            const bi = myVotes.findIndex((v) => v.question_id === b.id)
            return ai - bi
          })
          setVotedQuestions(sorted)
        }
      }

      setLoading(false)
    })
  }, [router])

  // Calendar data
  const questionsByDate = useMemo(() => {
    const map = new Map<string, QuestionWithStats[]>()
    for (const q of questions) {
      const d = toTaipeiDateStr(q.created_at)
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(q)
    }
    return map
  }, [questions])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - firstDow - daysInMonth).fill(null),
  ]

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const WEEKDAYS = isEn
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    : ['日', '一', '二', '三', '四', '五', '六']

  const monthLabel = isEn
    ? new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long' })
    : `${viewMonth + 1}月`

  const selectedQuestions = questionsByDate.get(selectedDate) ?? []

  function dayLabel(d: string) {
    if (d === today) return isEn ? 'Today' : '今天'
    const dt = new Date(d + 'T00:00:00')
    return isEn
      ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `${dt.getMonth() + 1}月${dt.getDate()}日`
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t('myq.title')}</h1>
          <Link href="/ask" className="btn-gradient px-4 py-2 rounded-full text-sm">
            + {isEn ? 'Ask' : '發問'}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-full mb-5">
          <button
            onClick={() => setTab('asked')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${tab === 'asked' ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {isEn ? 'My Questions' : '我的問題'}
          </button>
          <button
            onClick={() => setTab('voted')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${tab === 'voted' ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {isEn ? 'Voted' : '投票紀錄'}
          </button>
        </div>

        {loading && (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {/* ── Tab: Asked ── */}
        {!loading && tab === 'asked' && (
          <>
            {/* Calendar */}
            <div className="card p-4 mb-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors text-2xl leading-none">‹</button>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{monthLabel}</div>
                  <div className="text-xs text-gray-500">{viewYear}</div>
                </div>
                <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors text-2xl leading-none">›</button>
              </div>

              {(viewYear !== parseInt(today.slice(0, 4)) || viewMonth !== parseInt(today.slice(5, 7)) - 1) && (
                <div className="flex justify-center mb-3">
                  <button
                    onClick={() => { setViewYear(parseInt(today.slice(0, 4))); setViewMonth(parseInt(today.slice(5, 7)) - 1); setSelectedDate(today) }}
                    className="px-4 py-1 rounded-full text-xs font-medium gradient-bg text-white"
                  >
                    {isEn ? '↩ Today' : '↩ 回今日'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d, i) => (
                  <div key={d} className={`text-center text-xs py-1 font-medium ${i === 0 || i === 6 ? 'text-red-500/60' : 'text-gray-600'}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} className="h-12" />
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const qs = questionsByDate.get(dateStr) ?? []
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const hasActive = qs.some(q => !isExpired(q.expires_at) && q.status === 'active')
                  const hasEnded = qs.some(q => isExpired(q.expires_at) || q.status !== 'active')
                  const isWeekend = i % 7 === 0 || i % 7 === 6
                  return (
                    <button key={i} onClick={() => setSelectedDate(dateStr)}
                      className="flex flex-col items-center h-12 pt-1 rounded-xl hover:bg-white/5 transition-colors">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                        isSelected ? 'gradient-bg text-white'
                        : isToday ? 'border-2 border-violet-500 text-violet-300'
                        : isWeekend ? 'text-red-400/70'
                        : 'text-gray-300'
                      }`}>{day}</span>
                      <div className="flex gap-0.5 h-1.5 mt-0.5">
                        {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                        {hasEnded && <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected day */}
            {selectedDate && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-sm font-semibold text-white">{dayLabel(selectedDate)}</span>
                  {selectedQuestions.length > 0 && (
                    <span className="text-xs text-gray-600">· {selectedQuestions.length} {isEn ? 'questions' : '題'}</span>
                  )}
                </div>
                {selectedQuestions.length === 0 ? (
                  <div className="text-center py-10 text-gray-600 text-sm">{isEn ? 'No questions on this day' : '這天沒有發問'}</div>
                ) : (
                  <div className="space-y-4">
                    {selectedQuestions.map((q) => {
                      const active = !isExpired(q.expires_at) && q.status === 'active'
                      return (
                        <div key={q.id} className="card p-5">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <p className="text-white font-medium text-sm leading-snug line-clamp-2">{q.question_text}</p>
                              {q.category && (
                                <span className="shrink-0 bg-white/8 text-gray-400 px-2 py-0.5 rounded-full text-xs mt-0.5">
                                  {catLabel(q.category, isEn)}
                                </span>
                              )}
                            </div>
                            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-gray-500'}`}>
                              {active ? t('myq.live') : t('myq.ended')}
                            </span>
                          </div>
                          <div className="space-y-1.5 mb-4">
                            {[{ label: q.option_a, pct: q.pctA, gradient: true }, { label: q.option_b, pct: q.pctB, gradient: false }].map(({ label, pct, gradient }) => (
                              <div key={label} className="flex items-center gap-2 text-xs">
                                <span className="w-6 text-gray-500 truncate">{label}</span>
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${gradient ? 'gradient-bg' : 'bg-white/20'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 text-right text-gray-400">{pct}%</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{q.total} {isEn ? 'votes' : '票'}</span>
                            <button
                              onClick={() => setShareQ(q)}
                              className="btn-gradient px-4 py-1.5 rounded-full text-xs font-medium"
                            >
                              {isEn ? 'Share' : '分享結果'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {questions.length === 0 && (
              <div className="text-center mt-6 text-gray-500">
                <div className="text-5xl mb-4">💬</div>
                <p className="mb-4">{t('myq.empty')}</p>
                <Link href="/ask" className="btn-gradient px-6 py-3 rounded-2xl text-sm">{t('myq.emptyAction')}</Link>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Voted ── */}
        {!loading && tab === 'voted' && !isPro && (
          <div className="relative">
            {/* Blurred preview */}
            <div className="space-y-4 select-none pointer-events-none" style={{ filter: 'blur(6px)', opacity: 0.4 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5">
                  <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                  <div className="h-3 bg-white/8 rounded mb-4 w-1/3" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><div className="w-6 h-2 bg-white/10 rounded" /><div className="flex-1 h-1.5 bg-white/10 rounded-full" /><div className="w-8 h-2 bg-white/10 rounded" /></div>
                    <div className="flex items-center gap-2"><div className="w-6 h-2 bg-white/10 rounded" /><div className="flex-1 h-1.5 bg-white/10 rounded-full" /><div className="w-8 h-2 bg-white/10 rounded" /></div>
                  </div>
                </div>
              ))}
            </div>
            {/* Upgrade overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-[#0F0F0F]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center mx-4 shadow-2xl">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-white font-bold text-lg mb-1">
                  {isEn ? 'Pro Feature' : 'Pro 專屬功能'}
                </h3>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                  {isEn
                    ? 'Upgrade to Pro to see all the questions you voted on and their results.'
                    : '升級 Pro 即可查看你投票過的所有問題和即時結果。'}
                </p>
                <Link href="/pricing" className="btn-gradient px-6 py-3 rounded-2xl text-sm font-medium inline-block">
                  {isEn ? 'Upgrade to Pro →' : '升級 Pro →'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && tab === 'voted' && isPro && (
          <>
            {votedQuestions.length === 0 ? (
              <div className="text-center mt-16 text-gray-500">
                <div className="text-5xl mb-4">🗳️</div>
                <p className="mb-4">{isEn ? "You haven't voted yet" : '還沒有投票紀錄'}</p>
                <Link href="/vote" className="btn-gradient px-6 py-3 rounded-2xl text-sm">
                  {isEn ? 'Go Vote' : '去投票'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {votedQuestions.map((q) => {
                  const active = !isExpired(q.expires_at) && q.status === 'active'
                  const votedA = q.myVote === 'A'

                  return (
                    <Link key={q.id} href={`/result/${q.id}`}>
                      <div className="card p-5 hover:border-white/12 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="text-white font-medium text-sm leading-snug line-clamp-2">{q.question_text}</p>
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-gray-500'}`}>
                            {active ? t('myq.live') : t('myq.ended')}
                          </span>
                        </div>

                        {/* My vote highlight */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-600">{isEn ? 'You voted' : '你投了'}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold gradient-bg text-white">
                            {votedA ? q.option_a : q.option_b}
                          </span>
                        </div>

                        <div className="space-y-1.5 mb-3">
                          {[
                            { label: q.option_a, pct: q.pctA, mine: votedA },
                            { label: q.option_b, pct: q.pctB, mine: !votedA },
                          ].map(({ label, pct, mine }) => (
                            <div key={label} className="flex items-center gap-2 text-xs">
                              <span className={`w-6 truncate ${mine ? 'text-white font-medium' : 'text-gray-500'}`}>{label}</span>
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${mine ? 'gradient-bg' : 'bg-white/15'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`w-8 text-right ${mine ? 'text-white font-medium' : 'text-gray-500'}`}>{pct}%</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{q.total} {isEn ? 'votes' : '票'}</span>
                          {q.category && <span className="bg-white/5 px-2 py-0.5 rounded-full">{catLabel(q.category, isEn)}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {shareQ && (
        <ShareModal
          question={shareQ.question_text}
          optionA={shareQ.option_a}
          optionB={shareQ.option_b}
          pctA={shareQ.pctA}
          pctB={shareQ.pctB}
          totalVotes={shareQ.total}
          displayName={displayName}
          resultUrl={`https://votesnap.online/result/${shareQ.id}`}
          onClose={() => setShareQ(null)}
        />
      )}
    </div>
  )
}
