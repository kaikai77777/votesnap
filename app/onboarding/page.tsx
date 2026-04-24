'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { upsertProfile } from '@/lib/queries'
import { Logo, LogoWordmark } from '@/components/Logo'
import { AGE_RANGES, GENDERS, INTERESTS } from '@/types'
import { useLang } from '@/lib/i18n'

export default function OnboardingPage() {
  const router = useRouter()
  const { t } = useLang()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const STEPS = t('ob.steps').split(',')

  function toggleInterest(i: string) {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await upsertProfile({ id: user.id, display_name: displayName.trim() || null, age_range: age || null, gender: gender || null, interests: interests.length > 0 ? interests : [] })
    }
    router.push('/vote')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3"><Logo size={40} /></div>
          <LogoWordmark className="text-2xl" />
        </div>

        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'gradient-bg' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="card p-6 animate-fade-in">
          {step === 0 && (
            <>
              <h2 className="text-xl font-semibold mb-1">{t('ob.nameTitle')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('ob.nameSub')}</p>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value.slice(0, 20))}
                placeholder={t('ob.namePlaceholder')}
                autoFocus
                className="w-full bg-[#1E1E1E] rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder-gray-600"
              />
              <p className="text-right text-xs text-gray-600 mt-2">{displayName.length} / 20</p>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold mb-1">{t('ob.ageTitle')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('ob.ageSub')}</p>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RANGES.map((a) => (
                  <button key={a} onClick={() => setAge(a)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${age === a ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-1">{t('ob.genderTitle')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('ob.genderSub')}</p>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${gender === g ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold mb-1">{t('ob.interestsTitle')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('ob.interestsSub')}</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button key={i} onClick={() => toggleInterest(i)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${interests.includes(i) ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={() => router.push('/vote')}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
            {t('ob.skip')}
          </button>
          <button onClick={step < STEPS.length - 1 ? () => setStep((s) => s + 1) : finish}
            disabled={saving}
            className="flex-1 btn-gradient py-3 rounded-xl text-sm disabled:opacity-60">
            {saving ? t('ob.saving') : step < STEPS.length - 1 ? t('ob.next') : t('ob.done')}
          </button>
        </div>
      </div>
    </div>
  )
}
