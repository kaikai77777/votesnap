'use client'

import { useState, useEffect, useRef } from 'react'
import type { Question } from '@/types'
import { formatCountdown } from '@/lib/queries'
import { useLang } from '@/lib/i18n'

interface VoteCardProps {
  question: Question
  onVote: (vote: 'A' | 'B') => Promise<void>
  onSkip?: () => void
  current: number
  total: number
}

const SWIPE_THRESHOLD = 80

export function VoteCard({ question, onVote, onSkip, current, total }: VoteCardProps) {
  const { t } = useLang()
  const isEn = t('vote.loading') === 'Loading questions...'
  const [voting, setVoting] = useState<'A' | 'B' | null>(null)
  const [countdown, setCountdown] = useState(formatCountdown(question.expires_at))
  const [imgIndex, setImgIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  // Swipe state
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const images = question.image_urls?.filter(Boolean) ?? []

  useEffect(() => {
    const timer = setInterval(() => setCountdown(formatCountdown(question.expires_at)), 1000)
    return () => clearInterval(timer)
  }, [question.expires_at])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  async function handleVote(v: 'A' | 'B') {
    if (voting) return
    setVoting(v)
    await onVote(v)
    setVoting(null)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setIsSwiping(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isSwiping) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx) * 1.5) { setIsSwiping(false); setSwipeX(0); return }
    setSwipeX(dx)
  }

  function onTouchEnd() {
    if (!isSwiping) { setSwipeX(0); return }
    setIsSwiping(false)
    if (swipeX > SWIPE_THRESHOLD) handleVote('A')
    else if (swipeX < -SWIPE_THRESHOLD) handleVote('B')
    setSwipeX(0)
  }

  const swipeOpacity = Math.min(1, (Math.abs(swipeX) - 30) / 60)

  return (
    <>
      <div className="animate-slide-up w-full">
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <span>{current} {t('vote.of', { total })}</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-mono">{countdown}</span>
          </div>
        </div>

        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translateX(${swipeX * 0.35}px) rotate(${swipeX * 0.04}deg)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease',
          }}
          className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden shadow-2xl relative select-none"
        >
          {/* Swipe hint overlays */}
          {swipeX > 30 && (
            <div
              className="absolute inset-0 z-10 rounded-2xl flex items-center justify-start pl-8 pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.18))', opacity: swipeOpacity }}
            >
              <span className="text-green-400 font-black text-3xl border-4 border-green-400 rounded-xl px-3 py-1 rotate-[-12deg]">YES</span>
            </div>
          )}
          {swipeX < -30 && (
            <div
              className="absolute inset-0 z-10 rounded-2xl flex items-center justify-end pr-8 pointer-events-none"
              style={{ background: 'linear-gradient(to left, transparent, rgba(239,68,68,0.18))', opacity: swipeOpacity }}
            >
              <span className="text-red-400 font-black text-3xl border-4 border-red-400 rounded-xl px-3 py-1 rotate-[12deg]">NO</span>
            </div>
          )}

          {/* Image carousel */}
          {images.length > 0 && (
            <div className="relative overflow-hidden rounded-t-2xl">
              <button onClick={() => setLightbox(true)} className="w-full block relative group">
                <img src={images[imgIndex]} alt="" className="w-full h-52 object-cover block" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">點擊放大</span>
                </div>
              </button>
              {images.length > 1 && (
                <>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                    {images.map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`} />
                    ))}
                  </div>
                  {imgIndex > 0 && (
                    <button onClick={() => setImgIndex(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white z-10">‹</button>
                  )}
                  {imgIndex < images.length - 1 && (
                    <button onClick={() => setImgIndex(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white z-10">›</button>
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

        {/* Skip button */}
        {onSkip && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onSkip}
              className="text-gray-600 text-sm hover:text-gray-400 transition-colors px-6 py-2"
            >
              {isEn ? 'Skip →' : '略過 →'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20 transition-colors" onClick={() => setLightbox(false)}>×</button>
          <img src={images[imgIndex]} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              {imgIndex > 0 && (
                <button onClick={e => { e.stopPropagation(); setImgIndex(i => i - 1) }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-colors">‹</button>
              )}
              {imgIndex < images.length - 1 && (
                <button onClick={e => { e.stopPropagation(); setImgIndex(i => i + 1) }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-colors">›</button>
              )}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setImgIndex(i) }} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-5' : 'bg-white/30 w-1.5'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
