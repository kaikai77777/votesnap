'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveQuestionsForVoting, castVote } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { VoteCard } from '@/components/VoteCard'
import type { Question } from '@/types'
import Link from 'next/link'

export default function VotePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastResult, setLastResult] = useState<{ questionId: string; vote: 'A' | 'B' } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      setUserId(user.id)

      const { data, error } = await getActiveQuestionsForVoting(user.id)
      if (!error && data) setQuestions(data)
      setLoading(false)
    })
  }, [router])

  async function handleVote(vote: 'A' | 'B') {
    if (!userId || !questions[index]) return
    const q = questions[index]
    await castVote(q.id, userId, vote)
    setLastResult({ questionId: q.id, vote })

    // Advance after short delay for feedback
    setTimeout(() => {
      setLastResult(null)
      setIndex((i) => i + 1)
    }, 600)
  }

  const current = questions[index]
  const done = !loading && (!questions.length || index >= questions.length)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto flex flex-col items-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 mt-20 text-gray-500">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm">Loading questions...</p>
          </div>
        )}

        {!loading && done && (
          <div className="text-center mt-16 animate-fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
            <p className="text-gray-400 text-sm mb-8">
              暫時沒有新問題了，來發一個吧！
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <Link href="/ask" className="btn-gradient py-3.5 rounded-2xl text-center text-base">
                Ask Something →
              </Link>
              <Link
                href="/my-questions"
                className="py-3.5 rounded-2xl border border-white/10 text-gray-300 text-center text-base hover:bg-white/5 transition-colors"
              >
                My Questions
              </Link>
            </div>
          </div>
        )}

        {!loading && !done && current && (
          <div className="w-full mt-4">
            {/* Vote feedback overlay */}
            {lastResult && (
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className={`text-6xl animate-fade-in ${lastResult.vote === 'A' ? 'gradient-text' : ''}`}>
                  {lastResult.vote === 'A' ? '👍' : '👎'}
                </div>
              </div>
            )}

            <VoteCard
              question={current}
              onVote={handleVote}
              current={index + 1}
              total={questions.length}
            />

            {/* See results teaser */}
            <p className="text-center text-gray-600 text-xs mt-6">
              投完後可在{' '}
              <Link href="/my-questions" className="text-gray-400 underline underline-offset-2">
                My Questions
              </Link>{' '}
              查看你發的題目結果
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
