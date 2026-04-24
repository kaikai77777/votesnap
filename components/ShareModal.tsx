'use client'

import { useState } from 'react'

interface Props {
  question: string
  optionA: string
  optionB: string
  pctA: number
  pctB: number
  totalVotes: number
  displayName: string | null
  resultUrl: string
  onClose: () => void
}

function gradientText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number) {
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
  g.addColorStop(0, '#8B5CF6')
  g.addColorStop(0.5, '#EC4899')
  g.addColorStop(1, '#F97316')
  ctx.fillStyle = g
  ctx.fillText(text, x, y)
}

function drawOptionRow(
  ctx: CanvasRenderingContext2D,
  label: string, pct: number, votes: number,
  isWinner: boolean, rowY: number, rowW: number, rowX: number
) {
  const CIRCLE_R = 52
  const circleX = rowX + CIRCLE_R
  const circleY = rowY + CIRCLE_R

  // Circle background
  if (isWinner) {
    const cg = ctx.createRadialGradient(circleX, circleY, 0, circleX, circleY, CIRCLE_R)
    cg.addColorStop(0, '#9B73F7')
    cg.addColorStop(1, '#EC4899')
    ctx.fillStyle = cg
  } else {
    ctx.fillStyle = '#2A2A2E'
  }
  ctx.beginPath()
  ctx.arc(circleX, circleY, CIRCLE_R, 0, Math.PI * 2)
  ctx.fill()

  // Emoji
  ctx.font = '52px serif'
  ctx.textAlign = 'center'
  ctx.fillText(isWinner ? '👍' : '👎', circleX, circleY + 18)

  // Label text
  const labelX = rowX + CIRCLE_R * 2 + 36
  ctx.textAlign = 'left'
  ctx.font = `${isWinner ? 'bold' : 'normal'} 48px -apple-system, system-ui, sans-serif`
  ctx.fillStyle = isWinner ? '#FFFFFF' : '#6B7280'
  ctx.fillText(label, labelX, rowY + 62)

  // Percentage — large, right-aligned, gradient if winner
  const pctStr = `${pct}%`
  ctx.font = `bold 72px -apple-system, system-ui, sans-serif`
  ctx.textAlign = 'right'
  const pctX = rowX + rowW
  if (isWinner) {
    const pg = ctx.createLinearGradient(pctX - 200, 0, pctX, 0)
    pg.addColorStop(0, '#EC4899')
    pg.addColorStop(1, '#F97316')
    ctx.fillStyle = pg
  } else {
    ctx.fillStyle = '#4B5563'
  }
  ctx.fillText(pctStr, pctX, rowY + 62)

  // Vote count in parens
  ctx.font = '34px -apple-system, system-ui, sans-serif'
  ctx.fillStyle = isWinner ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'
  ctx.fillText(`(${votes}票)`, pctX, rowY + 102)

  // Progress bar
  const BAR_Y = rowY + 120, BAR_H = 22, BAR_W = rowW - CIRCLE_R * 2 - 36
  const BAR_X = labelX
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, BAR_H / 2)
  ctx.fill()
  if (pct > 0) {
    if (isWinner) {
      const bg = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W * (pct / 100), 0)
      bg.addColorStop(0, '#7C3AED')
      bg.addColorStop(0.5, '#EC4899')
      bg.addColorStop(1, '#F97316')
      ctx.fillStyle = bg
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
    }
    roundRect(ctx, BAR_X, BAR_Y, Math.max(BAR_W * (pct / 100), BAR_H), BAR_H, BAR_H / 2)
    ctx.fill()
  }
}

function generateImage(props: Omit<Props, 'onClose' | 'resultUrl' | 'displayName'> & { displayName?: string | null }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080, H = 1920
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    const F = '-apple-system, system-ui, sans-serif'

    // ── Background: deep navy ──
    ctx.fillStyle = '#0C0C14'
    ctx.fillRect(0, 0, W, H)

    // Purple glow top-left
    const g1 = ctx.createRadialGradient(W * 0.1, H * 0.05, 0, W * 0.3, H * 0.2, W * 0.85)
    g1.addColorStop(0, 'rgba(120,60,240,0.35)')
    g1.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)

    // Orange/red glow bottom-right
    const g2 = ctx.createRadialGradient(W * 0.9, H * 0.88, 0, W * 0.7, H * 0.75, W * 0.8)
    g2.addColorStop(0, 'rgba(220,50,30,0.28)')
    g2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

    // ── Top pill label ──
    const PILL_Y = 110, PILL_H = 68, PILL_W = 520
    const PILL_X = (W - PILL_W) / 2
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    roundRect(ctx, PILL_X, PILL_Y, PILL_W, PILL_H, PILL_H / 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.font = `38px ${F}`
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    const labelText = props.displayName ? `👤 ${props.displayName} 想知道大家怎麼想` : '👥 大家覺得呢？'
    ctx.fillText(labelText, W / 2, PILL_Y + 44)

    // ── Question text — large gradient ──
    const Q_FONT_SIZE = 110
    ctx.font = `bold ${Q_FONT_SIZE}px ${F}`
    ctx.textAlign = 'center'
    const qLines = wrapText(ctx, props.question, W - 120)
    const Q_LINE_H = 126
    const Q_START_Y = 260
    qLines.forEach((line, i) => {
      gradientText(ctx, line, W / 2, Q_START_Y + i * Q_LINE_H, W - 120)
    })

    // ── Sparkle decorations ──
    const sparkleY = Q_START_Y + qLines.length * Q_LINE_H + 30
    const sparkleColors = ['#8B5CF6', '#EC4899', '#F97316']
    const sparkleXs = [W / 2 - 80, W / 2, W / 2 + 80]
    sparkleXs.forEach((sx, si) => {
      ctx.save()
      ctx.translate(sx, sparkleY)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = sparkleColors[si]
      ctx.fillRect(-10, -10, 20, 20)
      ctx.restore()
    })

    // ── Results card ──
    const CARD_Y = sparkleY + 50
    const CARD_X = 60, CARD_W = W - 120, CARD_R = 56
    const ROW_H = 170  // height per option row
    const CARD_PAD = 50
    const CARD_INNER_W = CARD_W - CARD_PAD * 2
    const CARD_H = ROW_H * 2 + 80 + CARD_PAD * 2 + 60  // rows + separator + padding + total

    ctx.fillStyle = '#14141C'
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1.5
    roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R)
    ctx.fill(); ctx.stroke()

    // Option A
    const aVotes = Math.round((props.pctA / 100) * props.totalVotes)
    const bVotes = props.totalVotes - aVotes
    drawOptionRow(ctx, props.optionA, props.pctA, aVotes, props.pctA >= props.pctB,
      CARD_Y + CARD_PAD, CARD_INNER_W, CARD_X + CARD_PAD)

    // Separator
    const SEP_Y = CARD_Y + CARD_PAD + ROW_H + 10
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(CARD_X + CARD_PAD, SEP_Y)
    ctx.lineTo(CARD_X + CARD_W - CARD_PAD, SEP_Y)
    ctx.stroke()
    ctx.setLineDash([])

    // Option B
    drawOptionRow(ctx, props.optionB, props.pctB, bVotes, props.pctB > props.pctA,
      SEP_Y + 20, CARD_INNER_W, CARD_X + CARD_PAD)

    // Total votes
    const TOT_Y = SEP_Y + 20 + ROW_H + 20
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(CARD_X + CARD_PAD, TOT_Y)
    ctx.lineTo(CARD_X + CARD_W - CARD_PAD, TOT_Y)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.font = `36px ${F}`
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText(`👥  總投票數：${props.totalVotes} 票`, CARD_X + CARD_PAD, TOT_Y + 50)

    // ── CTA ──
    const CTA_Y = CARD_Y + CARD_H + 80
    ctx.font = `bold 80px ${F}`
    ctx.textAlign = 'center'
    gradientText(ctx, '你也來投票！', W / 2, CTA_Y, 600)

    ctx.font = `40px ${F}`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText('做不了決定？世界幫你選 ⚡', W / 2, CTA_Y + 70)

    // ── Footer pill ──
    const FT_H = 150, FT_W = W - 100, FT_X = 50, FT_Y = H - 200
    const ftg = ctx.createLinearGradient(FT_X, 0, FT_X + FT_W, 0)
    ftg.addColorStop(0, '#6D28D9')
    ftg.addColorStop(0.5, '#DB2777')
    ftg.addColorStop(1, '#EA580C')
    ctx.fillStyle = ftg
    roundRect(ctx, FT_X, FT_Y, FT_W, FT_H, FT_H / 2)
    ctx.fill()

    // Circle icon
    const IC_R = 48, IC_X = FT_X + 56 + IC_R, IC_Y = FT_Y + FT_H / 2
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath(); ctx.arc(IC_X, IC_Y, IC_R, 0, Math.PI * 2); ctx.fill()
    ctx.font = '46px serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('🔗', IC_X, IC_Y + 17)

    // Domain text — two-tone: white "votesnap" + orange ".online"
    const domX = IC_X + IC_R + 36
    ctx.font = `bold 62px ${F}`
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    const vsW = ctx.measureText('votesnap').width
    ctx.fillText('votesnap', domX, FT_Y + FT_H / 2 + 12)
    ctx.fillStyle = '#FED7AA'
    ctx.fillText('.online', domX + vsW, FT_Y + FT_H / 2 + 12)

    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas toBlob failed')), 'image/png')
  })
}


function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split('')
  const lines: string[] = []
  let cur = ''
  for (const ch of words) {
    const test = cur + ch
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = ch }
    else cur = test
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : [text]
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}


export default function ShareModal({ question, optionA, optionB, pctA, pctB, totalVotes, displayName, resultUrl, onClose }: Props) {
  const [savingImg, setSavingImg] = useState(false)
  const shareUrl = `https://votesnap.online/result/${resultUrl.split('/result/')[1] ?? ''}`
  const shareText = `${displayName ? `${displayName} 問：` : ''}「${question}」\n${optionA} ${pctA}% vs ${optionB} ${pctB}%\n快來投票！👉 ${shareUrl}`

  async function getImageBlob() {
    return generateImage({ question, optionA, optionB, pctA, pctB, totalVotes, displayName })
  }

  async function shareToThreads() {
    const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  async function shareToLine() {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  async function savePhoto() {
    setSavingImg(true)
    try {
      const blob = await getImageBlob()
      downloadBlob(blob)
    } finally {
      setSavingImg(false)
    }
  }

  function downloadBlob(blob: Blob) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'votesnap-result.png'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">分享結果</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Preview card — 9:16 thumbnail */}
        <div className="flex justify-center mb-6">
          <div
            className="rounded-2xl overflow-hidden w-28"
            style={{ aspectRatio: '9/16', background: '#0D0D10', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}
          >
            <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
            <div className="p-2.5 flex flex-col" style={{ height: 'calc(100% - 4px)' }}>
              <p className="text-[7px] font-bold mb-1.5">
                <span className="text-violet-400">vote</span><span className="text-white">snap</span>
              </p>
              {displayName && <p className="text-[6px] text-gray-500 text-center mb-1">{displayName} 問</p>}
              <p className="text-white font-bold text-[8px] leading-tight mb-2 text-center flex-1 flex items-center justify-center">{question}</p>
              <div className="space-y-1 mb-1.5">
                {[{ label: optionA, pct: pctA, winner: pctA >= pctB, gradient: true }, { label: optionB, pct: pctB, winner: pctB > pctA, gradient: false }].map(o => (
                  <div key={o.label}>
                    <div className="flex justify-between text-[6px] mb-0.5">
                      <span className={o.winner ? 'text-white font-semibold' : 'text-gray-500'}>{o.label}</span>
                      <span className={o.winner ? 'text-white font-bold' : 'text-gray-500'}>{o.pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${o.gradient ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400' : 'bg-white/20'}`} style={{ width: `${o.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-[5px]">共 {totalVotes} 票</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center" style={{ background: 'linear-gradient(90deg,#7C3AED,#EC4899,#F97316)' }}>
              <span className="text-white text-[5px] font-medium">votesnap.online</span>
            </div>
          </div>
        </div>

        {/* 3 share buttons */}
        <div className="px-8 pb-10 grid grid-cols-3 gap-6">
          {/* Instagram — downloads image for IG Stories */}
          <button onClick={savePhoto} disabled={savingImg} className="flex flex-col items-center gap-2 disabled:opacity-50">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-16 h-16">
                <defs><radialGradient id="ig2" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
                <rect width="24" height="24" rx="6" fill="url(#ig2)"/>
                <path fill="white" d="M12 7a5 5 0 100 10A5 5 0 0012 7zm0 8a3 3 0 110-6 3 3 0 010 6zm5.2-8.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-[11px] font-medium">{savingImg ? '儲存中...' : 'Instagram'}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">儲存後貼至限時動態</p>
            </div>
          </button>

          {/* Threads */}
          <button onClick={shareToThreads} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-16 h-16">
                <rect width="24" height="24" rx="6" fill="#000"/>
                <path d="M16.26 11.44a4.54 4.54 0 00-.27-.12c-.16-2.17-1.3-3.41-3.28-3.42h-.03c-1.18 0-2.16.5-2.77 1.42l1.12.77c.45-.68 1.15-.82 1.65-.82h.02c.64 0 1.12.19 1.42.56.22.27.37.65.43 1.13a7.8 7.8 0 00-1.8-.1c-1.81.1-2.97 1.14-2.9 2.58.04.73.41 1.36.99 1.77.5.35 1.14.52 1.8.49.88-.05 1.57-.4 2.07-1.03.38-.49.62-1.12.72-1.93.43.26.75.6.93 1.02.3.67.31 1.77-.6 2.68-.8.79-1.76 1.13-3.22 1.14-1.62-.01-2.84-.53-3.62-1.55-.74-.96-1.12-2.33-1.13-4.06.01-1.73.39-3.1 1.13-4.06.78-1.02 2-1.54 3.62-1.55 1.64.01 2.87.55 3.66 1.59.38.5.67 1.1.86 1.8l1.3-.35c-.23-.88-.6-1.64-1.1-2.27C15.36 6.68 13.81 6 11.93 6h-.04C10.02 6 8.46 6.68 7.4 7.98 6.46 9.15 5.98 10.8 5.97 12.82c.01 2.02.49 3.67 1.43 4.84C8.46 19.01 10.02 19.7 11.9 19.7h.04c1.7-.01 2.96-.46 3.97-1.46 1.32-1.3 1.28-2.93.84-3.93-.3-.68-.88-1.24-1.49-1.57v-.3zm-4.4 3.05c-.79.04-1.62-.31-1.65-1.09-.02-.58.41-1.22 1.74-1.3.15-.01.3-.01.44-.01.47 0 .91.05 1.31.13-.15 1.87-.98 2.23-1.84 2.27z" fill="white"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-[11px] font-medium">Threads</p>
              <p className="text-gray-600 text-[10px] mt-0.5">發文分享</p>
            </div>
          </button>

          {/* LINE */}
          <button onClick={shareToLine} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-16 h-16">
                <rect width="24" height="24" rx="6" fill="#06C755"/>
                <path fill="white" d="M12 4.5C7.86 4.5 4.5 7.3 4.5 10.75c0 2.95 2.62 5.42 6.16 5.89.24.05.57.16.65.36.07.18.05.47.02.65l-.1.62c-.03.18-.15.72.63.39.78-.33 4.2-2.47 5.73-4.23A5.1 5.1 0 0019.5 10.75C19.5 7.3 16.14 4.5 12 4.5zm-2.62 7.88H7.9a.38.38 0 01-.38-.38V9.25a.38.38 0 01.76 0v2.37h1.1a.38.38 0 010 .76zm1.37 0a.38.38 0 01-.76 0V9.25a.38.38 0 01.76 0v3.13zm3.4 0a.38.38 0 01-.34-.2l-1.43-1.95v1.77a.38.38 0 01-.76 0V9.25a.38.38 0 01.71-.2l1.44 1.96V9.25a.38.38 0 01.76 0v3.13a.38.38 0 01-.38.38v.02zm2.17 0h-1.5a.38.38 0 01-.38-.38V9.25a.38.38 0 01.76 0v2.75h1.12a.38.38 0 010 .76v.12z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-[11px] font-medium">LINE</p>
              <p className="text-gray-600 text-[10px] mt-0.5">傳給朋友</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
