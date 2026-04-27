'use client'

import { useState, useEffect } from 'react'
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
const PRO_DURATIONS = [4320, 10080, 43200]

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
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [todayCount, setTodayCount] = useState(0)

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

        <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('ask.category')}</label>
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
                {PRO_DURATIONS.map((d) => (
                  <button key={d} type="button"
                    onClick={() => isPro ? setDuration(d) : router.push('/pricing')}
                    className={`py-3 rounded-xl text-sm font-medium transition-all relative ${
                      isPro && duration === d ? 'gradient-bg text-white'
                      : isPro ? 'border border-white/10 text-gray-300 hover:border-white/20'
                      : 'border border-white/6 text-gray-600'
                    }`}>
                    {durationLabel(d, isEn)}
                    {!isPro && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] gradient-bg text-white font-bold leading-tight">PRO</span>
                    )}
                  </button>
                ))}
              </div>
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
