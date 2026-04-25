'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProfile, upsertProfile } from '@/lib/queries'
import { Navbar } from '@/components/Navbar'
import { AGE_RANGES, GENDERS, INTERESTS } from '@/types'
import { useLang } from '@/lib/i18n'

export default function SettingsPage() {
  const router = useRouter()
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace('/login')
      setUserId(user.id)
      setEmail(user.email ?? '')
      const { data: profile } = await getProfile(user.id)
      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setAge(profile.age_range ?? '')
        setGender(profile.gender ?? '')
        setInterests(profile.interests ?? [])
      }
      setLoading(false)
    })
  }, [router])

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  async function save() {
    setSaving(true)
    await upsertProfile({
      id: userId,
      display_name: displayName.trim() || null,
      age_range: age || null,
      gender: gender || null,
      interests,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-20 px-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">{isEn ? 'Profile Settings' : '個人設定'}</h1>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account info */}
            <div className="card p-5">
              <p className="text-xs text-gray-600 mb-1">{isEn ? 'Account' : '帳號'}</p>
              <p className="text-gray-300 text-sm">{email}</p>
            </div>

            {/* Nickname */}
            <div className="card p-5">
              <label className="text-xs text-gray-500 mb-2 block">{isEn ? 'Nickname' : '暱稱'}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value.slice(0, 20))}
                placeholder={isEn ? 'e.g. Alex, KK' : '例如：小明、阿凱'}
                className="w-full bg-[#252525] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder-gray-600"
              />
              <p className="text-right text-xs text-gray-600 mt-1.5">{displayName.length} / 20</p>
            </div>

            {/* Age */}
            <div className="card p-5">
              <label className="text-xs text-gray-500 mb-3 block">{isEn ? 'Age range' : '年齡區間'}</label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_RANGES.map(a => (
                  <button key={a} onClick={() => setAge(a === age ? '' : a)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${age === a ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="card p-5">
              <label className="text-xs text-gray-500 mb-3 block">{isEn ? 'Gender' : '性別'}</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map(g => (
                  <button key={g} onClick={() => setGender(g === gender ? '' : g)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${gender === g ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="card p-5">
              <label className="text-xs text-gray-500 mb-3 block">{isEn ? 'Interests' : '興趣'}</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => (
                  <button key={i} onClick={() => toggleInterest(i)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${interests.includes(i) ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules link */}
            <div className="text-center pt-2">
              <Link href="/rules" className="text-gray-600 text-xs hover:text-gray-400 transition-colors underline underline-offset-2">
                {isEn ? 'Community Rules' : '社群規範'}
              </Link>
            </div>

            {/* Save */}
            <button
              onClick={save}
              disabled={saving || saved}
              className="w-full btn-gradient py-4 rounded-2xl text-sm font-semibold disabled:opacity-70 transition-all"
            >
              {saved ? (isEn ? '✓ Saved!' : '✓ 已儲存！') : saving ? (isEn ? 'Saving...' : '儲存中...') : (isEn ? 'Save Changes' : '儲存設定')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
