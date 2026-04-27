'use client'

import { useState, useEffect, useRef } from 'react'
import type { Question } from '@/types'
import { formatCountdown } from '@/lib/queries'
import { useLang } from '@/lib/i18n'

interface VoteCardProps {
  question: Question
  onVote: (vote: string) => Promise<void>
  onSkip?: () => void
  current: number
  total: number
}

const SWIPE_THRESHOLD = 80

export function VoteCard({ question, onVote, onSkip, current, total }: VoteCardProps) {
  const { t } = useLang()
  const isEn = t('vote.loading') === 'Loading questions...'
  const [voting, setVoting] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(formatCountdown(question.expires_at, isEn))
  const [imgIndex, setImgIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [reported, setReported] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const images = question.image_urls?.filter(Boolean) ?? []

  const options = [
    { key: 'A', label: question.option_a },
    { key: 'B', label: question.option_b },
    ...(question.option_c ? [{ key: 'C', label: question.option_c }] : []),
    ...(question.option_d ? [{ key: 'D', label: question.option_d }] : []),
  ]
  const isMulti = options.length > 2

  useEffect(() => {
    const timer = setInterval(() => setCountdown(formatCountdown(question.expires_at, isEn)), 1000)
    return () => clearInterval(timer)
  }, [question.expires_at])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  async function handleReport() {
    if (reported) return
    await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: question.id, reason: 'user_report' }),
    })
    setReported(true)
    setShowReport(false)
  }

  async function handleVote(v: string) {
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
          onTouchStart={isMulti ? undefined : onTouchStart}
          onTouchMove={isMulti ? undefined : onTouchMove}
          onTouchEnd={isMulti ? undefined : onTouchEnd}
          style={!isMulti ? {
            transform: `translateX(${swipeX * 0.35}px) rotate(${swipeX * 0.04}deg)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease',
          } : undefined}
          className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden shadow-2xl relative select-none"
        >
          {!isMulti && swipeX > 30 && (
            <div
              className="absolute inset-0 z-10 rounded-2xl flex items-center justify-start pl-8 pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.18))', opacity: swipeOpacity }}
            >
              <span className="text-green-400 font-black text-3xl border-4 border-green-400 rounded-xl px-3 py-1 rotate-[-12deg]">YES</span>
            </div>
          )}
          {!isMulti && swipeX < -30 && (
            <div
              className="absolute inset-0 z-10 rounded-2xl flex items-center justify-end pr-8 pointer-events-none"
              style={{ background: 'linear-gradient(to left, transparent, rgba(239,68,68,0.18))', opacity: swipeOpacity }}
            >
              <span className="text-red-400 font-black text-3xl border-4 border-red-400 rounded-xl px-3 py-1 rotate-[12deg]">NO</span>
            </div>
          )}

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
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                {question.category && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/8 text-gray-300">
                    {question.category}
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowReport(s => !s)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${reported ? 'text-orange-400' : 'text-gray-600 hover:text-gray-400'}`}
                  title={isEn ? 'Report' : '檢舉'}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </button>
                {showReport && !reported && (
                  <div className="absolute right-0 top-8 z-20 bg-[#1C1C1E] border border-white/10 rounded-xl p-3 shadow-xl w-44">
                    <p className="text-xs text-gray-400 mb-2">{isEn ? 'Report this question?' : '檢舉此問題？'}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowReport(false)} className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-white/10">{isEn ? 'Cancel' : '取消'}</button>
                      <button onClick={handleReport} className="flex-1 py-1.5 rounded-lg text-xs bg-orange-500/80 text-white hover:bg-orange-500">{isEn ? 'Report' : '檢舉'}</button>
                    </div>
                  </div>
                )}
                {reported && <div className="absolute right-0 top-8 z-20 bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-orange-400 w-36 shadow-xl">{isEn ? 'Reported ✓' : '已檢舉 ✓'}</div>}
              </div>
            </div>

            <p className="text-white text-2xl font-semibold leading-snug mb-8 min-h-[60px]">
              {question.question_text}
            </p>

            {isMulti ? (
              <div className="flex flex-col gap-3">
                {options.map((opt, i) => (
                  <button key={opt.key} onClick={() => handleVote(opt.key)} disabled={!!voting}
                    className={`w-full py-4 rounded-2xl text-base font-bold transition-all disabled:cursor-not-allowed ${
                      voting === opt.key ? 'opacity-80 scale-[0.98]' : 'active:scale-[0.98]'
                    } ${i === 0
                      ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white'
                      : 'bg-[#1E1E1E] border border-white/10 text-white hover:bg-white/8'
                    }`}>
                    {voting === opt.key ? '✓' : opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleVote('B')} disabled={!!voting}
                  className={`py-4 rounded-2xl text-lg font-bold border border-white/10 transition-all disabled:cursor-not-allowed
                    ${voting === 'B' ? 'bg-red-500/20 border-red-500/50 text-red-400 scale-95' : 'bg-[#1E1E1E] text-white hover:bg-white/8 active:scale-95'}`}>
                  {voting === 'B' ? '✓' : `👎 ${options[1].label}`}
                </button>
                <button onClick={() => handleVote('A')} disabled={!!voting}
                  className={`py-4 rounded-2xl text-lg font-bold transition-all disabled:cursor-not-allowed
                    ${voting === 'A' ? 'opacity-80 scale-95' : 'hover:opacity-90 active:scale-95'}
                    bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 text-white`}>
                  {voting === 'A' ? '✓' : `👍 ${options[0].label}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {onSkip && (
          <div className="flex justify-center mt-4">
            <button onClick={onSkip} className="text-gray-600 text-sm hover:text-gray-400 transition-colors px-6 py-2">
              {isEn ? 'Skip →' : '略過 →'}
            </button>
          </div>
        )}
      </div>

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
