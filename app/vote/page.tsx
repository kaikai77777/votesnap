'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getActiveQuestionsForVoting, castVote, getProfile } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { VoteCard } from '@/components/VoteCard'
import { OnboardingModal } from '@/components/OnboardingModal'
import { useLang } from '@/lib/i18n'
import type { Question } from '@/types'

type DemoQuestion = Question & { isDemo: true }

const DEMO_ZH: DemoQuestion[] = [
  { id: 'demo-1', isDemo: true, user_id: '', question_text: '消夜要吃什麼？', option_a: '麥當勞', option_b: '豆漿店', category: '美食', duration_minutes: 10, status: 'active', expires_at: '', created_at: '', image_urls: null },
  { id: 'demo-2', isDemo: true, user_id: '', question_text: '這週末要幹嘛？', option_a: '出去玩', option_b: '在家躺平', category: '生活', duration_minutes: 10, status: 'active', expires_at: '', created_at: '', image_urls: null },
  { id: 'demo-3', isDemo: true, user_id: '', question_text: '現在要睡嗎？', option_a: '馬上睡', option_b: '再滑一下', category: '生活', duration_minutes: 10, status: 'active', expires_at: '', created_at: '', image_urls: null },
]

const DEMO_EN: DemoQuestion[] = [
  { id: 'demo-1', isDemo: true, user_id: '', question_text: 'What to eat tonight?', option_a: "McDonald's", option_b: 'Night market', category: 'Food', duration_minutes: 10, status: 'active', expires_at: '', created_at: '', image_urls: null },
  { id: 'demo-2', isDemo: true, user_id: '', question_text: 'This weekend?', option_a: 'Go out', option_b: 'Stay home', category: 'Life', duration_minutes: 10, status: 'active', expires_at: '', created_at: '', image_urls: null },
  { id: 'demo-3', isDemo: true, user_id: '', question_text: 'Should I sleep now?', option_a: 'Sleep now', option_b: 'One more scroll', category: 'Life', duration_minutes: 10, status: 'active', expires_at: '', created_at: '', image_urls: null },
]

export default function VotePage() {
  const router = useRouter()
  const { t } = useLang()
  const isEn = t('vote.loading') === 'Loading questions...'

  const [userId, setUserId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastVote, setLastVote] = useState<'A' | 'B' | null>(null)
  const [showDemoEnd, setShowDemoEnd] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      setUserId(user.id)

      // Show onboarding + demos only for truly new users (no interests set)
      const { data: profile } = await getProfile(user.id)
      const isNewUser = !profile?.interests || profile.interests.length === 0
      if (isNewUser) setShowOnboarding(true)

      const demos = (isEn ? DEMO_EN : DEMO_ZH) as Question[]
      const { data, error } = await getActiveQuestionsForVoting(user.id)
      const real = (!error && data) ? data : []

      setQuestions(isNewUser ? [...demos, ...real] : real)
      setLoading(false)
    })
  }, [router, isEn])

  async function handleVote(vote: 'A' | 'B') {
    if (!userId || !questions[index]) return
    const q = questions[index] as DemoQuestion

    if (!q.isDemo) {
      await castVote(q.id, userId, vote)
    }

    setLastVote(vote)

    // Check if next card transitions from demo → real
    const nextIndex = index + 1
    const nextQ = questions[nextIndex] as DemoQuestion | undefined
    const currentIsDemo = q.isDemo
    const nextIsReal = nextQ && !nextQ.isDemo

    if (currentIsDemo && nextIsReal) {
      setTimeout(() => {
        setLastVote(null)
        setShowDemoEnd(true)
        setTimeout(() => { setShowDemoEnd(false); setIndex(nextIndex) }, 1800)
      }, 600)
    } else {
      setTimeout(() => { setLastVote(null); setIndex(nextIndex) }, 600)
    }
  }

  const current = questions[index]
  const done = !loading && (!questions.length || index >= questions.length)
  const isDemo = !!(current as DemoQuestion)?.isDemo
  const demoCount = questions.filter(q => (q as DemoQuestion).isDemo).length
  const realTotal = questions.length - demoCount

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      {showOnboarding && userId && (
        <OnboardingModal userId={userId} onDone={() => setShowOnboarding(false)} />
      )}
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto flex flex-col items-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 mt-20 text-gray-500">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm">{t('vote.loading')}</p>
          </div>
        )}

        {/* Demo → Real transition */}
        {showDemoEnd && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
            <div className="text-center animate-fade-in">
              <div className="text-5xl mb-3">🎯</div>
              <p className="text-white font-bold text-xl">{isEn ? 'Now the real ones!' : '換真實問題了！'}</p>
              <p className="text-gray-400 text-sm mt-1">{isEn ? 'Help others decide' : '幫別人做決定'}</p>
            </div>
          </div>
        )}

        {!loading && done && (
          <div className="text-center mt-16 animate-fade-in">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">{t('vote.allDone')}</h2>
            <p className="text-gray-400 text-sm mb-8">{t('vote.allDoneSub')}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <Link href="/ask" className="btn-gradient py-3.5 rounded-2xl text-center text-base">{t('vote.askSomething')}</Link>
              <Link href="/trending" className="py-3.5 rounded-2xl border border-white/10 text-gray-300 text-center text-base hover:bg-white/5 transition-colors">
                {isEn ? '🔥 Check Hot Questions' : '🔥 看熱門排行榜'}
              </Link>
              <button
                onClick={() => { setIndex(0); setLoading(true); window.location.reload() }}
                className="py-3 text-gray-600 text-sm hover:text-gray-400 transition-colors"
              >
                {isEn ? '↻ Refresh for new questions' : '↻ 重新整理找新問題'}
              </button>
            </div>
          </div>
        )}

        {!loading && !done && current && !showDemoEnd && (
          <div className="w-full mt-4">
            {/* Demo badge */}
            {isDemo && (
              <div className="flex items-center justify-center mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20">
                  {isEn ? '✦ Try it out' : '✦ 先來試試看'}
                </span>
              </div>
            )}

            {lastVote && (
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="text-6xl animate-fade-in">{lastVote === 'A' ? '👍' : '👎'}</div>
              </div>
            )}

            <VoteCard
              question={current}
              onVote={handleVote}
              onSkip={!isDemo ? () => setIndex(i => i + 1) : undefined}
              current={isDemo ? index + 1 : index - demoCount + 1}
              total={isDemo ? demoCount : realTotal}
            />

            {!isDemo && (
              <p className="text-center text-gray-600 text-xs mt-6">
                {t('vote.tip')}{' '}
                <Link href="/my-questions" className="text-gray-400 underline underline-offset-2">{t('nav.myQ')}</Link>{' '}
                {t('vote.tip2')}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
