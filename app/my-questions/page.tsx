'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserQuestions, calcVoteStats, isExpired } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

interface QuestionWithStats extends Question {
  pctA: number
  pctB: number
  total: number
}

const TZ = 'Asia/Taipei'

function toTaipeiDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })
}

function todayTaipei(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

function formatTimeTaipei(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-TW', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
}

export default function MyQuestionsPage() {
  const router = useRouter()
  const { t } = useLang()
  const isEn = t('myq.title') === 'My Questions'

  const [questions, setQuestions] = useState<QuestionWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const today = todayTaipei()
  const [viewYear, setViewYear] = useState(() => parseInt(today.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(today.slice(5, 7)) - 1)
  const [selectedDate, setSelectedDate] = useState<string>(today)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      const { data: qs } = await getUserQuestions(user.id)
      if (!qs) { setLoading(false); return }
      const withStats = await Promise.all(
        qs.map(async (q) => {
          const { data: votes } = await supabase.from('votes').select('vote').eq('question_id', q.id)
          const stats = calcVoteStats(votes ?? [])
          return { ...q, pctA: stats.pctA, pctB: stats.pctB, total: stats.total }
        })
      )
      setQuestions(withStats)
      setLoading(false)
    })
  }, [router])

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

        {/* Calendar card */}
        <div className="card p-4 mb-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors text-2xl leading-none">
              ‹
            </button>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{monthLabel}</div>
              <div className="text-xs text-gray-500">{viewYear}</div>
            </div>
            <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/8 text-gray-400 hover:text-white transition-colors text-2xl leading-none">
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`text-center text-xs py-1 font-medium ${i === 0 ? 'text-red-500/60' : 'text-gray-600'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-12" />

              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const qs = questionsByDate.get(dateStr) ?? []
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              const hasActive = qs.some(q => !isExpired(q.expires_at) && q.status === 'active')
              const hasEnded = qs.some(q => isExpired(q.expires_at) || q.status !== 'active')
              const isSun = i % 7 === 0

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? '' : dateStr)}
                  className="flex flex-col items-center h-12 pt-1 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'gradient-bg text-white'
                      : isToday
                      ? 'border-2 border-violet-500 text-violet-300'
                      : isSun
                      ? 'text-red-400/70'
                      : 'text-gray-300'
                  }`}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 h-1.5 mt-0.5">
                    {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {hasEnded && <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-8">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Selected day list */}
        {!loading && selectedDate && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-sm font-semibold text-white">{dayLabel(selectedDate)}</span>
              {selectedQuestions.length > 0 && (
                <span className="text-xs text-gray-600">· {selectedQuestions.length} {isEn ? 'questions' : '題'}</span>
              )}
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="text-center py-10 text-gray-600 text-sm">
                {isEn ? 'No questions on this day' : '這天沒有發問'}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedQuestions.map((q) => {
                  const active = !isExpired(q.expires_at) && q.status === 'active'
                  return (
                    <Link key={q.id} href={`/result/${q.id}`}>
                      <div className="card p-5 hover:border-white/12 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <p className="text-white font-medium text-sm leading-snug line-clamp-2">{q.question_text}</p>
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-500/15 text-green-400' : 'bg-white/8 text-gray-500'}`}>
                            {active ? t('myq.live') : t('myq.ended')}
                          </span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-6 text-gray-500 truncate">{q.option_a}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full gradient-bg rounded-full" style={{ width: `${q.pctA}%` }} />
                            </div>
                            <span className="w-8 text-right text-gray-400">{q.pctA}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-6 text-gray-500 truncate">{q.option_b}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-white/20 rounded-full" style={{ width: `${q.pctB}%` }} />
                            </div>
                            <span className="w-8 text-right text-gray-400">{q.pctB}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{q.total} {isEn ? 'votes' : '票'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">{formatTimeTaipei(q.created_at)}</span>
                            {q.category && <span className="bg-white/5 px-2 py-0.5 rounded-full">{q.category}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && questions.length === 0 && (
          <div className="text-center mt-6 text-gray-500">
            <div className="text-5xl mb-4">💬</div>
            <p className="mb-4">{t('myq.empty')}</p>
            <Link href="/ask" className="btn-gradient px-6 py-3 rounded-2xl text-sm">
              {t('myq.emptyAction')}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
