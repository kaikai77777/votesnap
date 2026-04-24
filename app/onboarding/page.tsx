'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { upsertProfile } from '@/lib/queries'
import { Logo, LogoWordmark } from '@/components/Logo'
import { AGE_RANGES, GENDERS, INTERESTS } from '@/types'

const STEPS = ['年齡', '性別', '興趣']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    )
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await upsertProfile({
        id: user.id,
        age_range: age || null,
        gender: gender || null,
        interests: interests.length > 0 ? interests : [],
      })
    }
    router.push('/vote')
  }

  function skip() {
    router.push('/vote')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size={40} />
          </div>
          <LogoWordmark className="text-2xl" />
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                i <= step ? 'gradient-bg' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="card p-6 animate-fade-in">
          {step === 0 && (
            <>
              <h2 className="text-xl font-semibold mb-1">你的年齡區間？</h2>
              <p className="text-gray-500 text-sm mb-6">幫助我們推送更相關的問題</p>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RANGES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAge(a)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      age === a
                        ? 'gradient-bg border-transparent text-white'
                        : 'border-white/10 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold mb-1">你的性別？</h2>
              <p className="text-gray-500 text-sm mb-6">可跳過，不影響使用</p>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      gender === g
                        ? 'gradient-bg border-transparent text-white'
                        : 'border-white/10 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-1">你的興趣？</h2>
              <p className="text-gray-500 text-sm mb-6">選多個，幫你推薦相關問題</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      interests.includes(i)
                        ? 'gradient-bg border-transparent text-white'
                        : 'border-white/10 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={skip}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
          >
            跳過
          </button>
          <button
            onClick={step < STEPS.length - 1 ? () => setStep((s) => s + 1) : finish}
            disabled={saving}
            className="flex-1 btn-gradient py-3 rounded-xl text-sm disabled:opacity-60"
          >
            {saving ? '儲存中...' : step < STEPS.length - 1 ? '下一步' : '完成 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
