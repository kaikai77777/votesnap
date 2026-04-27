'use client'

import { useState, useEffect, useRef } from 'react'

interface Comment {
  id: string
  display_name: string | null
  content: string
  created_at: string
  user_id: string | null
}

interface Props {
  questionId: string
  currentUserId: string | null
  currentDisplayName: string | null
  anonymousId: string
  isEn: boolean
}

function timeAgo(iso: string, isEn: boolean): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return isEn ? 'just now' : '剛剛'
  if (diff < 3600) return isEn ? `${Math.floor(diff / 60)}m ago` : `${Math.floor(diff / 60)} 分前`
  if (diff < 86400) return isEn ? `${Math.floor(diff / 3600)}h ago` : `${Math.floor(diff / 3600)} 小時前`
  return isEn ? `${Math.floor(diff / 86400)}d ago` : `${Math.floor(diff / 86400)} 天前`
}

function avatarColor(name: string): string {
  const colors = ['bg-violet-500', 'bg-pink-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500']
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(hash) % colors.length]
}

export function CommentSection({ questionId, currentUserId, currentDisplayName, anonymousId, isEn }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState('')
  const [guestName, setGuestName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/comments?questionId=${questionId}`)
      .then(r => r.json())
      .then(d => { setComments(Array.isArray(d) ? d : []); setLoading(false) })
  }, [questionId])

  async function submit() {
    if (!input.trim() || submitting) return
    setSubmitting(true)
    const displayName = currentDisplayName || guestName.trim() || (isEn ? 'Anonymous' : '匿名')
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, content: input.trim(), displayName, anonymousId }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setComments(prev => [...prev, newComment])
      setInput('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSubmitting(false)
  }

  const name = (c: Comment) => c.display_name || (isEn ? 'Anonymous' : '匿名')

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-bold text-white">{isEn ? 'Comments' : '留言'}</h3>
        {!loading && <span className="text-sm text-gray-600">({comments.length})</span>}
      </div>

      {/* Comments list */}
      <div className="space-y-4 mb-5">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}
        {!loading && comments.length === 0 && (
          <p className="text-center text-gray-600 text-sm py-6">
            {isEn ? 'No comments yet. Be the first!' : '還沒有留言，來說點什麼吧！'}
          </p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className={`shrink-0 w-8 h-8 rounded-full ${avatarColor(name(c))} flex items-center justify-center text-white text-xs font-bold`}>
              {name(c).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-medium text-white">{name(c)}</span>
                <span className="text-xs text-gray-600">{timeAgo(c.created_at, isEn)}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed break-words">{c.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="card p-4 space-y-3">
        {!currentUserId && (
          <input
            value={guestName}
            onChange={e => setGuestName(e.target.value.slice(0, 20))}
            placeholder={isEn ? 'Your name (optional)' : '你的名字（選填）'}
            className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
          />
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 200))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder={isEn ? 'Leave a comment...' : '說點什麼...'}
            rows={2}
            className="flex-1 bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 resize-none"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || submitting}
            className="shrink-0 w-10 h-10 rounded-xl gradient-bg flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            {submitting
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
          </button>
        </div>
        <p className="text-xs text-gray-700 text-right">{input.length}/200</p>
      </div>
    </div>
  )
}
