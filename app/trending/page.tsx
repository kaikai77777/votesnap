'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isExpired } from '@/lib/queries'
import { CATEGORIES, CATEGORY_EN } from '@/types'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

type Period = 'today' | 'week' | 'all'

interface RankedQuestion extends Question {
  voteCount: number
  pctA: number
  pctB: number
}

const MEDAL = ['🥇', '🥈', '🥉']
const MIN_VOTES: Record<Period, number> = { today: 5, week: 10, all: 30 }

export default function TrendingPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  const [period, setPeriod] = useState<Period>('today')
  const [questions, setQuestions] = useState<RankedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string | null>(null)
  const [showMyInterests, setShowMyInterests] = useState(false)
  const [userInterests, setUserInterests] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('interests').eq('id', user.id).single()
      if (profile?.interests?.length) setUserInterests(profile.interests)
    })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()

      const now = new Date()
      let rangeStart: string | null = null

      if (period === 'today') {
        const d = new Date(now)
        d.setHours(0, 0, 0, 0)
        rangeStart = d.toISOString()
      } else if (period === 'week') {
        const d = new Date(now)
        d.setDate(d.getDate() - 7)
        rangeStart = d.toISOString()
      }

      let qQuery = supabase
        .from('questions')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(200)

      if (rangeStart) qQuery = qQuery.gte('created_at', rangeStart)

      const { data: qs } = await qQuery
      if (!qs || qs.length === 0) { setQuestions([]); setLoading(false); return }

      const { data: votes } = await supabase
        .from('votes')
        .select('question_id, vote')
        .in('question_id', qs.map(q => q.id))

      const countMap: Record<string, { a: number; b: number }> = {}
      for (const v of votes ?? []) {
        if (!countMap[v.question_id]) countMap[v.question_id] = { a: 0, b: 0 }
        if (v.vote === 'A') countMap[v.question_id].a++
        else countMap[v.question_id].b++
      }

      const ranked: RankedQuestion[] = qs
        .map(q => {
          const { a, b } = countMap[q.id] ?? { a: 0, b: 0 }
          const total = a + b
          return {
            ...q,
            voteCount: total,
            pctA: total > 0 ? Math.round((a / total) * 100) : 0,
            pctB: total > 0 ? Math.round((b / total) * 100) : 0,
          }
        })
        .filter(q => q.voteCount >= MIN_VOTES[period])
        .sort((a, b) => b.voteCount - a.voteCount)

      setQuestions(ranked)
      setLoading(false)
    }
    load()
  }, [period])

  const filteredQuestions = questions.filter(q => {
    if (showMyInterests && userInterests.length > 0) return userInterests.includes(q.category ?? '')
    if (category) return q.category === category
    return true
  })

  const TABS: { key: Period; label: string }[] = [
    { key: 'today', label: isEn ? 'Today' : '今日' },
    { key: 'week',  label: isEn ? 'This Week' : '本週' },
    { key: 'all',   label: isEn ? 'All Time' : '全部' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-20 px-4 max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-2xl font-bold">{isEn ? '🔥 Hot' : '🔥 熱榜'}</h1>
          <span className="text-xs text-gray-600">{isEn ? 'ranked by total votes' : '依總投票數排名'}</span>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-full mb-4">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${period === key ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <button
            onClick={() => { setCategory(null); setShowMyInterests(false) }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${!category && !showMyInterests ? 'gradient-bg text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>
            {isEn ? 'All' : '全部'}
          </button>
          {userInterests.length > 0 && (
            <button
              onClick={() => { setShowMyInterests(true); setCategory(null) }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${showMyInterests ? 'gradient-bg text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>
              ⭐ {isEn ? 'My interests' : '我的興趣'}
            </button>
          )}
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => { setCategory(c); setShowMyInterests(false) }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === c ? 'gradient-bg text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>
              {isEn ? (CATEGORY_EN[c] ?? c) : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center mt-20 text-gray-600">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-sm">{isEn ? 'No questions yet for this period' : '這段期間還沒有符合門檻的問題'}</p>
            <Link href="/vote" className="btn-gradient px-6 py-3 rounded-2xl text-sm mt-4 inline-block">
              {isEn ? 'Go vote →' : '去投票累積人氣 →'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q, i) => {
              const active = !isExpired(q.expires_at) && q.status === 'active'
              return (
                <Link key={q.id} href={`/result/${q.id}`}>
                  <div className={`card p-4 hover:border-white/15 transition-colors cursor-pointer ${i < 3 ? 'border-white/10' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-9 h-9 flex items-center justify-center">
                        {i < 3 ? (
                          <span className="text-2xl leading-none">{MEDAL[i]}</span>
                        ) : (
                          <span className="text-gray-600 font-bold text-sm">#{i + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <p className="text-white text-sm font-medium leading-snug line-clamp-2 flex-1">{q.question_text}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {q.category && (
                              <span className="text-xs text-gray-500 bg-white/6 px-2 py-0.5 rounded-full">
                                {isEn ? (CATEGORY_EN[q.category] ?? q.category) : q.category}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-500/15 text-green-400' : 'bg-white/6 text-gray-500'}`}>
                              {active ? (isEn ? 'Live' : '進行中') : (isEn ? 'Ended' : '已結束')}
                            </span>
                          </div>
                        </div>

                        {q.voteCount > 0 && (
                          <div className="space-y-1 mb-2">
                            {[
                              { label: q.option_a, pct: q.pctA, gradient: true },
                              { label: q.option_b, pct: q.pctB, gradient: false },
                            ].map(({ label, pct, gradient }) => (
                              <div key={label} className="flex items-center gap-2 text-xs">
                                <span className="w-10 text-gray-500 truncate shrink-0">{label}</span>
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${gradient ? 'gradient-bg' : 'bg-white/20'}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-7 text-right text-gray-400 shrink-0">{pct}%</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span>🗳️</span>
                          <span className="font-semibold text-gray-400">{q.voteCount}</span>
                          <span>{isEn ? 'votes' : '票'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
