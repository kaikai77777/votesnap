'use client'

import { useState } from 'react'
import { INTERESTS, CATEGORY_EN } from '@/types'
import { upsertProfile } from '@/lib/queries'
import { useLang } from '@/lib/i18n'

interface Props {
  userId: string
  onDone: () => void
}

const INTEREST_EN: Record<string, string> = {
  '時尚': 'Fashion', '美妝': 'Beauty', '美食': 'Food', '旅遊': 'Travel',
  '音樂': 'Music', '運動': 'Sports', '科技': 'Tech', '金融': 'Finance',
  '愛情': 'Love', '職涯': 'Career', '健康': 'Health', '遊戲': 'Gaming',
}

export function OnboardingModal({ userId, onDone }: Props) {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'
  const [step, setStep] = useState<1 | 2>(1)
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggle(i: string) {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  async function finish() {
    setSaving(true)
    await upsertProfile({ id: userId, interests: selected })
    setSaving(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Step indicator */}
        <div className="flex gap-1.5 p-5 pb-0">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'gradient-bg' : 'bg-white/10'}`} />
          ))}
        </div>

        {step === 1 ? (
          <div className="p-6">
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isEn ? 'Add to Home Screen' : '加到主畫面'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {isEn
                ? 'Get the full app experience — faster launch, no browser bar.'
                : '像 App 一樣使用 votesnap，開啟更快、沒有瀏覽器工具列。'}
            </p>

            <div className="bg-white/5 rounded-2xl p-4 space-y-2 text-xs text-gray-400 mb-6">
              {isEn ? (
                <>
                  <p className="font-medium text-gray-300">iOS Safari</p>
                  <p>Tap <span className="text-white">□↑</span> → "Add to Home Screen" → Add</p>
                  <p className="font-medium text-gray-300 mt-2">Android Chrome</p>
                  <p>Tap <span className="text-white">⋮</span> → "Add to Home screen" → Add</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-300">iOS Safari</p>
                  <p>點底部 <span className="text-white">□↑</span> → 加入主畫面 → 新增</p>
                  <p className="font-medium text-gray-300 mt-2">Android Chrome</p>
                  <p>點右上 <span className="text-white">⋮</span> → 加到主畫面 → 新增</p>
                </>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl gradient-bg text-white font-semibold text-sm"
            >
              {isEn ? 'Got it →' : '了解，下一步 →'}
            </button>
            <button onClick={onDone} className="w-full mt-2 py-2 text-gray-600 text-xs hover:text-gray-400 transition-colors">
              {isEn ? 'Skip' : '略過'}
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-white mb-1">
              {isEn ? 'What do you like?' : '你喜歡哪些話題？'}
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              {isEn ? 'We'll show you questions you care about.' : '我們會優先顯示你感興趣的問題。'}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {INTERESTS.map(i => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selected.includes(i) ? 'gradient-bg text-white' : 'border border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  {isEn ? (INTEREST_EN[i] ?? i) : i}
                </button>
              ))}
            </div>

            <button
              onClick={finish}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl gradient-bg text-white font-semibold text-sm disabled:opacity-60"
            >
              {saving ? '...' : (isEn ? 'Start Voting 🗳️' : '開始投票 🗳️')}
            </button>
            {selected.length === 0 && (
              <button onClick={onDone} className="w-full mt-2 py-2 text-gray-600 text-xs hover:text-gray-400 transition-colors">
                {isEn ? 'Skip for now' : '先跳過'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
