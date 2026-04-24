'use client'

import { useState, useEffect } from 'react'
import type { Question } from '@/types'
import { formatCountdown } from '@/lib/queries'
import { useLang } from '@/lib/i18n'

interface VoteCardProps {
  question: Question
  onVote: (vote: 'A' | 'B') => Promise<void>
  current: number
  total: number
}

export function VoteCard({ question, onVote, current, total }: VoteCardProps) {
  const { t } = useLang()
  const [voting, setVoting] = useState<'A' | 'B' | null>(null)
  const [countdown, setCountdown] = useState(formatCountdown(question.expires_at))
  const [imgIndex, setImgIndex] = useState(0)
  const images = question.image_urls?.filter(Boolean) ?? []

  useEffect(() => {
    const timer = setInterval(() => setCountdown(formatCountdown(question.expires_at)), 1000)
    return () => clearInterval(timer)
  }, [question.expires_at])

  async function handleVote(v: 'A' | 'B') {
    if (voting) return
    setVoting(v)
    await onVote(v)
    setVoting(null)
  }

  return (
    <div className="animate-slide-up w-full">
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <span>{current} {t('vote.of', { total })}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 font-mono">{countdown}</span>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
        {/* Image carousel */}
        {images.length > 0 && (
          <div className="relative">
            <img src={images[imgIndex]} alt="" className="w-full h-52 object-cover" />
            {images.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`} />
                  ))}
                </div>
                {imgIndex > 0 && (
                  <button onClick={() => setImgIndex(i => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">‹</button>
                )}
                {imgIndex < images.length - 1 && (
                  <button onClick={() => setImgIndex(i => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">›</button>
                )}
              </>
            )}
          </div>
        )}

        <div className="p-6">
          {question.category && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/8 text-gray-300 mb-4">
              {question.category}
            </span>
          )}
          <p className="text-white text-2xl font-semibold leading-snug mb-8 min-h-[60px]">
            {question.question_text}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleVote('B')} disabled={!!voting}
              className={`py-4 rounded-2xl text-lg font-bold border border-white/10 transition-all disabled:cursor-not-allowed
                ${voting === 'B' ? 'bg-red-500/20 border-red-500/50 text-red-400 scale-95' : 'bg-[#1E1E1E] text-white hover:bg-white/8 active:scale-95'}`}>
              {voting === 'B' ? '✓' : `👎 ${question.option_b}`}
            </button>
            <button onClick={() => handleVote('A')} disabled={!!voting}
              className={`py-4 rounded-2xl text-lg font-bold transition-all disabled:cursor-not-allowed
                ${voting === 'A' ? 'opacity-80 scale-95' : 'hover:opacity-90 active:scale-95'}
                bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white`}>
              {voting === 'A' ? '✓' : `👍 ${question.option_a}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
