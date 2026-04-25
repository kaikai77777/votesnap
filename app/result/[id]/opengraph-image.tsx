import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function calcStats(votes: { vote: string }[]) {
  const total = votes.length
  const a = votes.filter(v => v.vote === 'A').length
  const pctA = total > 0 ? Math.round((a / total) * 100) : 0
  return { total, pctA, pctB: total > 0 ? 100 - pctA : 0 }
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: q } = await supabase.from('questions').select('*').eq('id', id).single()
  const { data: votes } = await supabase.from('votes').select('vote').eq('question_id', id)
  if (!q) return new Response('Not found', { status: 404 })

  const { total, pctA, pctB } = calcStats(votes ?? [])

  return new ImageResponse(
    <div
      style={{
        width: '100%', height: '100%',
        background: '#0C0C18',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '72px 96px',
        position: 'relative',
      }}
    >
      {/* Purple glow top-left */}
      <div style={{
        position: 'absolute', top: -100, left: -100,
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(100,40,220,0.5) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />
      {/* Red glow bottom-right */}
      <div style={{
        position: 'absolute', bottom: -100, right: -100,
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(180,30,10,0.45) 0%, transparent 70%)',
        borderRadius: '50%',
      }} />

      {/* Pill */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'rgba(255,255,255,0.09)',
        border: '1.5px solid rgba(255,255,255,0.2)',
        borderRadius: 40, padding: '10px 28px',
        marginBottom: 32,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 24 }}>👥 大家覺得呢？</span>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 64, fontWeight: 800,
        background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #F97316)',
        backgroundClip: 'text',
        color: 'transparent',
        textAlign: 'center',
        lineHeight: 1.2,
        marginBottom: 52,
        maxWidth: 900,
      }}>
        {q.question_text}
      </div>

      {/* Options card */}
      <div style={{
        width: '100%', maxWidth: 900,
        background: '#13131B',
        border: '1.5px solid rgba(255,255,255,0.07)',
        borderRadius: 32, padding: '36px 48px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {[
          { label: q.option_a, pct: pctA, winner: pctA >= pctB },
          { label: q.option_b, pct: pctB, winner: pctB > pctA },
        ].map(({ label, pct, winner }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: winner ? '#fff' : '#6B7280', fontSize: 30, fontWeight: winner ? 700 : 400 }}>{label}</span>
              <span style={{
                fontSize: 38, fontWeight: 800,
                color: winner ? 'transparent' : '#4B5563',
                background: winner ? 'linear-gradient(90deg, #EC4899, #F97316)' : 'none',
                backgroundClip: winner ? 'text' : 'none',
              }}>{pct}%</span>
            </div>
            <div style={{ height: 14, background: 'rgba(255,255,255,0.07)', borderRadius: 8, display: 'flex' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                width: `${pct}%`,
                background: winner
                  ? 'linear-gradient(90deg, #7C3AED, #EC4899, #F97316)'
                  : 'rgba(255,255,255,0.15)',
              }} />
            </div>
          </div>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 22, marginTop: 4 }}>
          👥 總投票數：{total} 票
        </span>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 40,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>votesnap</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: '#FED7AA' }}>.online</span>
      </div>
    </div>,
    { ...size }
  )
}
