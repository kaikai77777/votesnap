'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createQuestion, uploadQuestionImages } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { ImageUploader } from '@/components/ImageUploader'
import { useLang } from '@/lib/i18n'
import { CATEGORIES, CATEGORY_EN } from '@/types'

const DAILY_LIMIT = 5
const MAX_CHARS = 120

const FREE_DURATIONS = [15, 60, 1440]
const PRO_MIN = 5
const PRO_MAX = 10080 // 7 days in minutes

const TEMPLATES_ZH = [
  { q: '要不要主動傳訊息給他？', a: '傳！', b: '等對方' },
  { q: '這件衣服值得買嗎？', a: '買！', b: '算了' },
  { q: '消夜要吃什麼？', a: '麥當勞', b: '豆漿店' },
  { q: '這樣做對嗎？', a: '對的', b: '重新考慮' },
  { q: '要不要換工作？', a: '換！', b: '繼續撐' },
]

const TEMPLATES_EN = [
  { q: 'Should I text first?', a: 'Do it!', b: 'Wait' },
  { q: 'Is this outfit worth buying?', a: 'Buy it!', b: 'Pass' },
  { q: 'What to eat tonight?', a: "McDonald's", b: 'Night market' },
  { q: 'Am I making the right choice?', a: 'Yes!', b: 'Think again' },
  { q: 'Should I quit my job?', a: 'Quit!', b: 'Stay' },
]

function durationLabel(m: number, isEn: boolean): string {
  if (m < 60) return isEn ? `${m} min` : `${m} 分鐘`
  if (m < 1440) return isEn ? `${m / 60} hr` : `${m / 60} 小時`
  const d = m / 1440
  return isEn ? `${d}d` : `${d} 天`
}

export default function AskPage() {
  const router = useRouter()
  const { t } = useLang()
  const isEn = t('ask.title') === 'Ask anything'
  const [userId, setUserId] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [text, setText] = useState('')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [category, setCategory] = useState('')
  const [duration, setDuration] = useState(1440)
  const [customVal, setCustomVal] = useState(1)
  const [customUnit, setCustomUnit] = useState<'min' | 'hr' | 'day'>('day')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [todayCount, setTodayCount] = useState(0)
  const [aiInput, setAiInput] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ question: string; optionA: string; optionB: string }>>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [autoCategorizingMsg, setAutoCategorizingMsg] = useState(false)
  const autoCatTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
      setIsPro(profile?.is_pro ?? false)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('questions').select('id').eq('user_id', user.id)
        .gte('created_at', today.toISOString())
      setTodayCount(data?.length ?? 0)
    })
  }, [router])

  // Auto-categorize with debounce when user types question
  useEffect(() => {
    if (autoCatTimer.current) clearTimeout(autoCatTimer.current)
    if (text.length < 8) return
    setAutoCategorizingMsg(true)
    autoCatTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai-categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text }),
        })
        const { category: suggested } = await res.json()
        if (suggested) setCategory(suggested)
      } finally {
        setAutoCategorizingMsg(false)
      }
    }, 1500)
    return () => { if (autoCatTimer.current) clearTimeout(autoCatTimer.current) }
  }, [text])

  const TEMPLATES = isEn ? TEMPLATES_EN : TEMPLATES_ZH

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setText(tpl.q)
    setOptions([tpl.a, tpl.b])
  }

  async function fetchAiSuggestions() {
    if (!aiInput.trim()) return
    setAiLoading(true)
    setAiSuggestions([])
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiInput, lang: isEn ? 'en' : 'zh' }),
      })
      const { suggestions } = await res.json()
      setAiSuggestions(suggestions ?? [])
    } finally {
      setAiLoading(false)
    }
  }

  function applyAiSuggestion(s: { question: string; optionA: string; optionB: string }) {
    setText(s.question)
    setOptions([s.optionA, s.optionB])
    setShowAi(false)
    setAiSuggestions([])
    setAiInput('')
  }

  function updateOption(i: number, val: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val.slice(0, 20) : o))
  }

  function addOption() {
    if (options.length >= 4) return
    setOptions(prev => [...prev, ''])
  }

  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!text.trim()) return setError(t('ask.errorEmpty'))
    if (!isPro && todayCount >= DAILY_LIMIT) return setError(t('ask.errorLimit'))

    setSubmitting(true)
    setError('')

    const { data, error: err } = await createQuestion({
      user_id: userId,
      question_text: text.trim(),
      option_a: options[0] || 'Yes',
      option_b: options[1] || 'No',
      option_c: options[2] || undefined,
      option_d: options[3] || undefined,
      category: category || '其他',
      duration_minutes: duration,
      is_priority: isPro,
    })

    if (err || !data) {
      setError(err?.message ?? 'Error')
      setSubmitting(false)
      return
    }

    if (imageFiles.length > 0) {
      await uploadQuestionImages(imageFiles, data.id)
    }

    router.push(`/result/${data.id}?created=true`)
  }

  const remaining = isPro ? Infinity : DAILY_LIMIT - todayCount

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('ask.title')}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            {isPro ? (
              <span className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-xs gradient-bg font-semibold">PRO</span>
                {isEn ? 'Unlimited questions' : '無限發問'}
              </span>
            ) : (
              <>
                {t('ask.remaining', { n: remaining })}
                {remaining === 0 && (
                  <Link href="/pricing" className="text-orange-400 hover:underline underline-offset-2">
                    — {t('ask.upgradePro')}
                  </Link>
                )}
              </>
            )}
          </p>
        </div>

        {/* AI suggest modal */}
        {showAi && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAi(false)}>
            <div className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">✦ AI 幫我想題目</h3>
                <button onClick={() => setShowAi(false)} className="text-gray-500 hover:text-white">×</button>
              </div>
              <input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchAiSuggestions()}
                placeholder={isEn ? 'Describe your situation...' : '描述你的情境，例如：不知道要不要換手機'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                autoFocus
              />
              <button onClick={fetchAiSuggestions} disabled={aiLoading || !aiInput.trim()}
                className="w-full btn-gradient py-3 rounded-xl text-sm disabled:opacity-40">
                {aiLoading ? (isEn ? 'Thinking...' : 'AI 思考中...') : (isEn ? 'Generate →' : '生成題目 →')}
              </button>
              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  {aiSuggestions.map((s, i) => (
                    <button key={i} onClick={() => applyAiSuggestion(s)}
                      className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl p-3 transition-colors">
                      <p className="text-white text-sm font-medium mb-1">{s.question}</p>
                      <p className="text-gray-500 text-xs">{s.optionA} / {s.optionB}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">{isEn ? '🔥 Popular templates' : '🔥 熱門問法'}</p>
              <button type="button" onClick={() => setShowAi(true)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                ✦ {isEn ? 'AI suggest' : 'AI 幫我想'}
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TEMPLATES.map((tpl, i) => (
                <button key={i} type="button" onClick={() => applyTemplate(tpl)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-white/10 text-gray-400 hover:border-violet-500/40 hover:text-violet-400 transition-all whitespace-nowrap">
                  {tpl.q}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('ask.qLabel')} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t('ask.qPlaceholder')}
              rows={3}
              className="w-full bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none text-base leading-relaxed"
            />
            <div className="flex justify-end mt-2">
              <span className={`text-xs ${text.length > MAX_CHARS * 0.9 ? 'text-orange-400' : 'text-gray-600'}`}>
                {text.length} / {MAX_CHARS}
              </span>
            </div>
          </div>

          <div className="card p-5">
            <ImageUploader files={imageFiles} onChange={setImageFiles} maxFiles={3} />
          </div>

          {/* Options */}
          <div className="card p-5 space-y-3">
            <label className="block text-sm font-medium text-gray-400">{t('ask.options')}</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-4 shrink-0">{String.fromCharCode(65 + i)}</span>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={i === 0 ? 'Yes' : i === 1 ? 'No' : `${isEn ? 'Option' : '選項'} ${i + 1}`}
                  className="flex-1 bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                {i >= 2 && (
                  <button type="button" onClick={() => removeOption(i)}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-600 hover:text-red-400 flex items-center justify-center transition-colors shrink-0">
                    ×
                  </button>
                )}
              </div>
            ))}
            {options.length < 4 && (
              <button type="button" onClick={addOption}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-gray-600 text-sm hover:border-white/20 hover:text-gray-400 transition-colors">
                + {isEn ? 'Add option' : '新增選項'}
              </button>
            )}
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-400">{t('ask.category')}</label>
                {autoCategorizingMsg && <span className="text-xs text-violet-400 animate-pulse">✦ AI 自動分類中...</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      category === c ? 'gradient-bg text-white' : 'border border-white/10 text-gray-400 hover:border-white/20'
                    }`}>{isEn ? (CATEGORY_EN[c] ?? c) : c}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('ask.duration')}</label>
              <div className="grid grid-cols-3 gap-2">
                {FREE_DURATIONS.map((d) => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      duration === d ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'
                    }`}>
                    {d === 15 && '⚡ '}
                    {durationLabel(d, isEn)}
                  </button>
                ))}
              </div>

              {isPro ? (
                <div className="mt-3">
                  <p className="text-xs text-violet-400 mb-2">✦ {isEn ? 'Custom duration (Pro)' : '自訂時效（Pro）'}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={customVal}
                      onChange={e => {
                        const v = Math.max(1, Number(e.target.value))
                        setCustomVal(v)
                        const toMin = customUnit === 'min' ? v : customUnit === 'hr' ? v * 60 : v * 1440
                        const clamped = Math.min(PRO_MAX, Math.max(PRO_MIN, toMin))
                        setDuration(clamped)
                      }}
                      className="w-24 bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-violet-500/50"
                    />
                    <select
                      value={customUnit}
                      onChange={e => {
                        const u = e.target.value as 'min' | 'hr' | 'day'
                        setCustomUnit(u)
                        const toMin = u === 'min' ? customVal : u === 'hr' ? customVal * 60 : customVal * 1440
                        const clamped = Math.min(PRO_MAX, Math.max(PRO_MIN, toMin))
                        setDuration(clamped)
                      }}
                      className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="min">{isEn ? 'min' : '分鐘'}</option>
                      <option value="hr">{isEn ? 'hr' : '小時'}</option>
                      <option value="day">{isEn ? 'day' : '天'}</option>
                    </select>
                    <span className="text-xs text-gray-600 shrink-0">
                      → {durationLabel(Math.min(PRO_MAX, Math.max(PRO_MIN, duration)), isEn)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    {isEn ? `Range: 5 min – 7 days` : `範圍：5 分鐘 ～ 7 天`}
                  </p>
                </div>
              ) : (
                <button type="button" onClick={() => router.push('/pricing')}
                  className="mt-3 w-full py-2.5 rounded-xl border border-white/8 text-gray-600 text-xs hover:text-violet-400 hover:border-violet-500/30 transition-colors relative">
                  {isEn ? 'Custom duration (up to 7 days)' : '自訂時效（最長 7 天）'}
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] gradient-bg text-white font-bold leading-tight">PRO</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={submitting || !text.trim() || (!isPro && remaining === 0)}
            className="w-full btn-gradient py-4 rounded-2xl text-base disabled:opacity-40">
            {submitting ? t('ask.submitting') : t('ask.submit')}
          </button>
        </form>
      </main>
    </div>
  )
}
