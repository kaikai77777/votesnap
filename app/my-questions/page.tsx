'use client'

import { useState, useEffect } from 'react'
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

export default function MyQuestionsPage() {
  const router = useRouter()
  const { t } = useLang()
  const [questions, setQuestions] = useState<QuestionWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')

      const { data: qs } = await getUserQuestions(user.id)
      if (!qs) { setLoading(false); return }

      // Fetch vote counts for all questions
      const withStats = await Promise.all(
        qs.map(async (q) => {
          const { data: votes } = await supabase
            .from('votes')
            .select('vote')
            .eq('question_id', q.id)
          const stats = calcVoteStats(votes ?? [])
          return { ...q, pctA: stats.pctA, pctB: stats.pctB, total: stats.total }
        })
      )

      setQuestions(withStats)
      setLoading(false)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('myq.title')}</h1>
          <Link href="/ask" className="btn-gradient px-4 py-2 rounded-full text-sm">
            + Ask
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && questions.length === 0 && (
          <div className="text-center mt-16 text-gray-500">
            <div className="text-5xl mb-4">💬</div>
            <p className="mb-4">{t('myq.empty')}</p>
            <Link href="/ask" className="btn-gradient px-6 py-3 rounded-2xl text-sm">
              {t('myq.emptyAction')}
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {questions.map((q) => {
            const expired = isExpired(q.expires_at)
            const active = !expired && q.status === 'active'

            return (
              <Link key={q.id} href={`/result/${q.id}`}>
                <div className="card p-5 hover:border-white/12 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <p className="text-white font-medium text-sm leading-snug line-clamp-2">
                      {q.question_text}
                    </p>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        active
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-white/8 text-gray-500'
                      }`}
                    >
                      {active ? t('myq.live') : t('myq.ended')}
                    </span>
                  </div>

                  {/* Mini result bars */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-gray-500">{q.option_a}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-bg rounded-full transition-all"
                          style={{ width: `${q.pctA}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-400">{q.pctA}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-gray-500">{q.option_b}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/20 rounded-full transition-all"
                          style={{ width: `${q.pctB}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-400">{q.pctB}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{q.total} votes</span>
                    {q.category && (
                      <span className="bg-white/5 px-2 py-0.5 rounded-full">{q.category}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
