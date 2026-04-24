'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createQuestion, uploadQuestionImages } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { ImageUploader } from '@/components/ImageUploader'
import { useLang } from '@/lib/i18n'
import { CATEGORIES } from '@/types'

const DAILY_LIMIT = 3
const MAX_CHARS = 120

export default function AskPage() {
  const router = useRouter()
  const { t } = useLang()
  const [userId, setUserId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [optionA, setOptionA] = useState('Yes')
  const [optionB, setOptionB] = useState('No')
  const [category, setCategory] = useState('')
  const [duration, setDuration] = useState(10)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      setUserId(user.id)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('questions').select('id').eq('user_id', user.id)
        .gte('created_at', today.toISOString())
      setTodayCount(data?.length ?? 0)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    if (!text.trim()) return setError(t('ask.errorEmpty'))
    if (todayCount >= DAILY_LIMIT) return setError(t('ask.errorLimit'))

    setSubmitting(true)
    setError('')

    const { data, error: err } = await createQuestion({
      user_id: userId,
      question_text: text.trim(),
      option_a: optionA || 'Yes',
      option_b: optionB || 'No',
      category: category || '查看更多',
      duration_minutes: duration,
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

  const remaining = DAILY_LIMIT - todayCount

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('ask.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('ask.remaining', { n: remaining })}
            {remaining === 0 && (
              <Link href="/pricing" className="text-orange-400 ml-2 hover:underline underline-offset-2">
                — {t('ask.upgradePro')}
              </Link>
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

          <div className="card p-5 space-y-3">
            <label className="block text-sm font-medium text-gray-400">{t('ask.options')}</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <span className="text-xs text-gray-600 mb-1 block">{t('ask.optionA')}</span>
                <input value={optionA} onChange={(e) => setOptionA(e.target.value.slice(0, 20))}
                  placeholder="Yes"
                  className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
              </div>
              <div className="flex items-center pt-4 text-gray-600">/</div>
              <div className="flex-1">
                <span className="text-xs text-gray-600 mb-1 block">{t('ask.optionB')}</span>
                <input value={optionB} onChange={(e) => setOptionB(e.target.value.slice(0, 20))}
                  placeholder="No"
                  className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('ask.category')}</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      category === c ? 'gradient-bg border-transparent text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t('ask.duration')}</label>
              <div className="flex gap-2">
                {[10, 15, 30].map((d) => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                      duration === d ? 'gradient-bg border-transparent text-white' : 'border-white/10 text-gray-300 hover:border-white/20'
                    }`}>{t('ask.durationMin', { n: d })}</button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={submitting || !text.trim() || remaining === 0}
            className="w-full btn-gradient py-4 rounded-2xl text-base disabled:opacity-40">
            {submitting ? t('ask.submitting') : t('ask.submit')}
          </button>
        </form>
      </main>
    </div>
  )
}
