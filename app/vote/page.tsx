'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getProfile } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { VoteCard } from '@/components/VoteCard'
import { OnboardingModal } from '@/components/OnboardingModal'
import { subscribeToPush } from '@/components/PushInit'
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

function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('votesnap_anon_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('votesnap_anon_id', id) }
  return id
}

function getLocalVotedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem('votesnap_voted') || '[]'))
  } catch { return new Set() }
}

function addLocalVotedId(id: string) {
  try {
    const s = getLocalVotedIds()
    s.add(id)
    localStorage.setItem('votesnap_voted', JSON.stringify(Array.from(s)))
  } catch {}
}

export default function VotePage() {
  const { t } = useLang()
  const isEn = t('vote.loading') === 'Loading questions...'

  const [userId, setUserId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastVote, setLastVote] = useState<string | null>(null)
  const [showDemoEnd, setShowDemoEnd] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const anonId = getAnonymousId()
    setAnonymousId(anonId)

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const uid = user?.id ?? null
      setUserId(uid)

      let showDemos = false
      if (uid) {
        const demoKey = `demo_shown_${uid}`
        const alreadySeenDemo = !!localStorage.getItem(demoKey)
        if (!alreadySeenDemo) {
          const { data: profile } = await getProfile(uid)
          const isNewUser = !profile?.interests || profile.interests.length === 0
          if (isNewUser) {
            setShowOnboarding(true)
            showDemos = true
            localStorage.setItem(demoKey, '1')
          }
        }
      }

      const demos = (isEn ? DEMO_EN : DEMO_ZH) as Question[]
      const params = new URLSearchParams()
      if (!uid && anonId) params.set('anon', anonId)
      const res = await fetch(`/api/questions/feed?${params}`)
      const feedData = res.ok ? await res.json() : []
      const localVoted = getLocalVotedIds()
      const real = Array.isArray(feedData) ? feedData.filter((q: Question) => !localVoted.has(q.id)) : []

      setQuestions(showDemos ? [...demos, ...real] : real)
      setLoading(false)
    })
  }, [isEn])

  async function handlePushAccept() {
    setShowPushPrompt(false)
    await subscribeToPush()
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleVote(vote: string) {
    const q = questions[index] as DemoQuestion
    if (!q) return

    if (!q.isDemo) {
      const res = await fetch('/api/votes/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, vote, anonymousId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (json.code === '23505') {
          showToast(isEn ? 'Already voted on this one!' : '你已經投過這題了！')
          addLocalVotedId(q.id)
        }
        // EXPIRED or other errors: silently skip
        setIndex(i => i + 1)
        return
      }
      addLocalVotedId(q.id)
      fetch('/api/push/milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id }),
      }).catch(() => {})

      // First-vote push prompt (show once, only if permission not yet granted)
      if (!localStorage.getItem('push_prompted') && 'Notification' in window && Notification.permission === 'default') {
        localStorage.setItem('push_prompted', '1')
        setTimeout(() => setShowPushPrompt(true), 800)
      }
    }

    setLastVote(vote)

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
  const isEnded = current?.status === 'ended'
  const demoCount = questions.filter(q => (q as DemoQuestion).isDemo).length
  const realTotal = questions.length - demoCount

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      {showOnboarding && userId && (
        <OnboardingModal userId={userId} onDone={() => setShowOnboarding(false)} />
      )}

      {showPushPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl p-6 space-y-4">
            <div className="text-3xl text-center">🔔</div>
            <div className="text-center">
              <h3 className="font-bold text-white text-lg">{isEn ? 'Stay in the loop' : '開啟投票通知'}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {isEn ? 'Get notified when your questions hit milestones or end.' : '題目到達 5/10/50 票或結束時通知你'}
              </p>
            </div>
            <button onClick={handlePushAccept} className="w-full btn-gradient py-3.5 rounded-2xl text-sm font-semibold">
              {isEn ? 'Enable notifications' : '開啟通知'}
            </button>
            <button onClick={() => setShowPushPrompt(false)} className="w-full py-2 text-gray-600 text-sm hover:text-gray-400 transition-colors">
              {isEn ? 'Not now' : '之後再說'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3 text-sm text-white shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto flex flex-col items-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 mt-20 text-gray-500">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm">{t('vote.loading')}</p>
          </div>
        )}

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
              {userId ? (
                <Link href="/ask" className="btn-gradient py-3.5 rounded-2xl text-center text-base">{t('vote.askSomething')}</Link>
              ) : (
                <Link href="/login" className="btn-gradient py-3.5 rounded-2xl text-center text-base">
                  {isEn ? 'Login to ask questions' : '登入後發問'}
                </Link>
              )}
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
            {(isDemo || isEnded) && (
              <div className="flex items-center justify-center mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  isEnded
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-violet-500/15 text-violet-400 border-violet-500/20'
                }`}>
                  {isEnded ? '🔥 熱門回顧' : (isEn ? '✦ Try it out' : '✦ 先來試試看')}
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

            {!isDemo && !userId && (
              <div className="mt-6 text-center">
                <Link href="/login" className="text-violet-400 text-sm hover:underline">
                  {isEn ? 'Login to ask your own questions →' : '登入後可以自己發問 →'}
                </Link>
              </div>
            )}

            {!isDemo && userId && (
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
