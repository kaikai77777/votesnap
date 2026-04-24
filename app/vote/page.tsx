'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getActiveQuestionsForVoting, castVote } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { VoteCard } from '@/components/VoteCard'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

export default function VotePage() {
  const router = useRouter()
  const { t } = useLang()
  const [userId, setUserId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastVote, setLastVote] = useState<'A' | 'B' | null>(null)

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
    await castVote(questions[index].id, userId, vote)
    setLastVote(vote)
    setTimeout(() => { setLastVote(null); setIndex((i) => i + 1) }, 600)
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
            <p className="text-sm">{t('vote.loading')}</p>
          </div>
        )}

        {!loading && done && (
          <div className="text-center mt-16 animate-fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">{t('vote.allDone')}</h2>
            <p className="text-gray-400 text-sm mb-8">{t('vote.allDoneSub')}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <Link href="/ask" className="btn-gradient py-3.5 rounded-2xl text-center text-base">
                {t('vote.askSomething')}
              </Link>
              <Link href="/my-questions" className="py-3.5 rounded-2xl border border-white/10 text-gray-300 text-center text-base hover:bg-white/5 transition-colors">
                {t('vote.myQ')}
              </Link>
            </div>
          </div>
        )}

        {!loading && !done && current && (
          <div className="w-full mt-4">
            {lastVote && (
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="text-6xl animate-fade-in">{lastVote === 'A' ? '👍' : '👎'}</div>
              </div>
            )}
            <VoteCard question={current} onVote={handleVote} current={index + 1} total={questions.length} />
            <p className="text-center text-gray-600 text-xs mt-6">
              {t('vote.tip')}{' '}
              <Link href="/my-questions" className="text-gray-400 underline underline-offset-2">
                {t('nav.myQ')}
              </Link>{' '}
              {t('vote.tip2')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
