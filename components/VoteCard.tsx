'use client'

import { useState, useEffect } from 'react'
import type { Question } from '@/types'
import { formatCountdown, isExpired } from '@/lib/queries'

interface VoteCardProps {
  question: Question
  onVote: (vote: 'A' | 'B') => Promise<void>
  current: number
  total: number
}

export function VoteCard({ question, onVote, current, total }: VoteCardProps) {
  const [voting, setVoting] = useState<'A' | 'B' | null>(null)
  const [countdown, setCountdown] = useState(formatCountdown(question.expires_at))

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(question.expires_at))
    }, 1000)
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
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <span>{current} / {total} questions</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 font-mono">{countdown}</span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-6 shadow-2xl">
        {question.category && (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/8 text-gray-300 mb-4">
            {question.category}
          </span>
        )}

        <p className="text-white text-2xl font-semibold leading-snug mb-8 min-h-[80px]">
          {question.question_text}
        </p>

        {/* Vote buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote('B')}
            disabled={!!voting}
            className={`py-4 rounded-2xl text-lg font-bold border border-white/10 transition-all
              ${voting === 'B'
                ? 'bg-red-500/20 border-red-500/50 text-red-400 scale-95'
                : 'bg-[#1E1E1E] text-white hover:bg-white/8 active:scale-95'}
              disabled:cursor-not-allowed`}
          >
            {voting === 'B' ? 'Voted!' : `👎 ${question.option_b}`}
          </button>

          <button
            onClick={() => handleVote('A')}
            disabled={!!voting}
            className={`py-4 rounded-2xl text-lg font-bold transition-all
              ${voting === 'A'
                ? 'opacity-80 scale-95'
                : 'hover:opacity-90 active:scale-95'}
              bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white
              disabled:cursor-not-allowed`}
          >
            {voting === 'A' ? 'Voted!' : `👍 ${question.option_a}`}
          </button>
        </div>
      </div>
    </div>
  )
}
