'use client'

import { useState, useEffect } from 'react'

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

const F = '-apple-system, system-ui, sans-serif'

function gradientText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number) {
  const w = ctx.measureText(text).width
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0)
  g.addColorStop(0, '#8B5CF6')
  g.addColorStop(0.5, '#EC4899')
  g.addColorStop(1, '#F97316')
  ctx.fillStyle = g
  ctx.fillText(text, cx, y)
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    const test = cur + ch
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = ch }
    else cur = test
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : [text]
}

// Row layout (matches Image #25):
//   [Circle+emoji]  [Label text]               [XX%]
//   [======= full-width progress bar =======] (NNN票)
function drawOptionRow(
  ctx: CanvasRenderingContext2D,
  label: string, pct: number, votes: number,
  isWinner: boolean, rowY: number, rowW: number, rowX: number,
  showStats = true
) {
  const R = 50
  const CX = rowX + R
  const LINE_Y = rowY + R  // vertical center of circle / text

  // Circle
  if (isWinner) {
    const cg = ctx.createRadialGradient(CX, LINE_Y, 0, CX, LINE_Y, R)
    cg.addColorStop(0, '#9B73F7'); cg.addColorStop(1, '#EC4899')
    ctx.fillStyle = cg
  } else {
    ctx.fillStyle = '#272730'
  }
  ctx.beginPath(); ctx.arc(CX, LINE_Y, R, 0, Math.PI * 2); ctx.fill()

  ctx.font = '48px serif'; ctx.textAlign = 'center'
  ctx.fillText(isWinner ? '👍' : '👎', CX, LINE_Y + 17)

  // Label
  const LX = rowX + R * 2 + 28
  ctx.font = `bold 52px ${F}`; ctx.textAlign = 'left'
  ctx.fillStyle = isWinner ? '#FFFFFF' : '#6B7280'
  ctx.fillText(label, LX, LINE_Y + 19)

  // % (right-aligned, same line)
  const RX = rowX + rowW
  ctx.font = `bold 82px ${F}`; ctx.textAlign = 'right'
  if (!showStats) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.fillText('?', RX, LINE_Y + 19)
  } else if (isWinner) {
    const pw = ctx.measureText(`${pct}%`).width
    const pg = ctx.createLinearGradient(RX - pw - 10, 0, RX, 0)
    pg.addColorStop(0, '#EC4899'); pg.addColorStop(1, '#F97316')
    ctx.fillStyle = pg
    ctx.fillText(`${pct}%`, RX, LINE_Y + 19)
  } else {
    ctx.fillStyle = '#4B5563'
    ctx.fillText(`${pct}%`, RX, LINE_Y + 19)
  }

  // Progress bar — full width, below circle bottom
  const BY = LINE_Y + R + 18
  const BH = 20
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  roundRect(ctx, rowX, BY, rowW, BH, BH / 2); ctx.fill()
  if (pct > 0) {
    const fillW = Math.max(rowW * (pct / 100), BH)
    if (isWinner) {
      const bg = ctx.createLinearGradient(rowX, 0, rowX + rowW, 0)
      bg.addColorStop(0, '#7C3AED'); bg.addColorStop(0.5, '#EC4899'); bg.addColorStop(1, '#F97316')
      ctx.fillStyle = bg
    } else {
      ctx.fillStyle = '#374151'
    }
    roundRect(ctx, rowX, BY, fillW, BH, BH / 2); ctx.fill()
  }

  // Vote count — right-aligned, below bar
  ctx.font = `30px ${F}`; ctx.textAlign = 'right'
  ctx.fillStyle = isWinner ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)'
  ctx.fillText(`(${votes}票)`, RX, BY + BH + 38)
}

export function generateShareImage(props: Omit<Props, 'onClose' | 'resultUrl'>): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080, H = 1920
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // ── Background ──
    ctx.fillStyle = '#0C0C18'
    ctx.fillRect(0, 0, W, H)
    const g1 = ctx.createRadialGradient(W * 0.05, H * 0.02, 0, W * 0.28, H * 0.22, W * 0.9)
    g1.addColorStop(0, 'rgba(80,30,190,0.70)'); g1.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
    const g2 = ctx.createRadialGradient(W * 0.95, H * 0.98, 0, W * 0.78, H * 0.82, W * 0.88)
    g2.addColorStop(0, 'rgba(200,35,10,0.60)'); g2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

    // ── Pill badge ──
    const pillLabel = props.displayName ? `👤 ${props.displayName} 想知道大家怎麼想` : '👥 大家覺得呢？'
    ctx.font = `38px ${F}`
    const pillTW = ctx.measureText(pillLabel).width
    const PH = 68, PW = pillTW + 88, PX = (W - PW) / 2, PY = 96
    ctx.fillStyle = 'rgba(255,255,255,0.09)'
    roundRect(ctx, PX, PY, PW, PH, PH / 2); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5
    roundRect(ctx, PX, PY, PW, PH, PH / 2); ctx.stroke()
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(pillLabel, W / 2, PY + PH / 2 + 14)

    // ── Question text ──
    const QFS = 128
    ctx.font = `bold ${QFS}px ${F}`
    ctx.textAlign = 'center'
    const qLines = wrapText(ctx, props.question, W - 180)
    const QLH = 146, QY = PY + PH + 148
    qLines.forEach((line, i) => gradientText(ctx, line, W / 2, QY + i * QLH))
    const qBottom = QY + qLines.length * QLH

    // Tick decorations beside question
    const qMidY = QY - QFS * 0.18 + (qLines.length * QLH) / 2
    const tickDefs = [
      { x: 58, dy: -72, angle: -0.52, color: '#8B5CF6', len: 54 },
      { x: 36, dy: 2,   angle: -Math.PI / 8, color: '#EC4899', len: 44 },
      { x: 78, dy: 66,  angle: 0.42, color: '#F97316', len: 34 },
    ]
    tickDefs.forEach(({ x, dy, angle, color, len }) => {
      ;[1, -1].forEach(side => {
        ctx.save()
        ctx.translate(side === 1 ? x : W - x, qMidY + dy)
        ctx.rotate(side === 1 ? angle : Math.PI - angle)
        ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke()
        ctx.restore()
      })
    })

    // ── Sparkles (3 diamonds) ──
    const sparkY = qBottom + 46
    ;[W / 2 - 78, W / 2, W / 2 + 78].forEach((sx, si) => {
      ctx.save(); ctx.translate(sx, sparkY); ctx.rotate(Math.PI / 4)
      ctx.fillStyle = ['#7C3AED', '#EC4899', '#F97316'][si]
      ctx.fillRect(-10, -10, 20, 20); ctx.restore()
    })

    // ── Card ──
    // Row height: circle(100) + gap(18) + bar(20) + vote-text(38+bottom12) = ~188
    const CARD_X = 48, CARD_W = W - 96
    const CP = 50         // card padding
    const ROW_H = 188
    const SEP = 42        // space around separator line
    const FOOT = 70       // total-votes footer row height
    const CARD_H = CP + ROW_H + SEP + ROW_H + SEP + FOOT + CP
    const CARD_Y = sparkY + 54

    ctx.fillStyle = '#13131B'
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5
    roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 52); ctx.fill(); ctx.stroke()

    const IW = CARD_W - CP * 2
    const IRX = CARD_X + CP
    const showStats = props.totalVotes >= 5
    const isHot = props.totalVotes > 50
    const aV = Math.round((props.pctA / 100) * props.totalVotes)
    const bV = props.totalVotes - aV

    drawOptionRow(ctx, props.optionA, props.pctA, aV, props.pctA >= props.pctB, CARD_Y + CP, IW, IRX, showStats)

    const S1Y = CARD_Y + CP + ROW_H + SEP / 2
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
    ctx.setLineDash([9, 9])
    ctx.beginPath(); ctx.moveTo(CARD_X + CP, S1Y); ctx.lineTo(CARD_X + CARD_W - CP, S1Y); ctx.stroke()
    ctx.setLineDash([])

    drawOptionRow(ctx, props.optionB, props.pctB, bV, props.pctB > props.pctA, CARD_Y + CP + ROW_H + SEP, IW, IRX, showStats)

    const S2Y = CARD_Y + CP + ROW_H + SEP + ROW_H + SEP / 2
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    ctx.beginPath(); ctx.moveTo(CARD_X + CP, S2Y); ctx.lineTo(CARD_X + CARD_W - CP, S2Y); ctx.stroke()
    ctx.setLineDash([])

    ctx.font = `34px ${F}`; ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.fillText(`👥  總投票數：${props.totalVotes} 票`, CARD_X + CP, S2Y + FOOT / 2 + 12)

    // ── CTA ──
    const cardBottom = CARD_Y + CARD_H
    const FT_H = 152, FT_Y = H - FT_H - 54
    // Place CTA centered between card bottom and footer
    const ctaSpace = FT_Y - cardBottom
    const CTA_Y = cardBottom + ctaSpace * 0.3

    // Chevron side decorations
    const chevDefs = [
      { x: 78,  dy: 44, size: 52, color: '#8B5CF6' },
      { x: 44,  dy: 48, size: 38, color: '#EC4899' },
      { x: 118, dy: 82, size: 28, color: '#F97316' },
    ]
    chevDefs.forEach(({ x, dy, size, color }) => {
      ;[1, -1].forEach(side => {
        ctx.save()
        ctx.globalAlpha = 0.30
        ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        const bx = side === 1 ? x : W - x
        ctx.beginPath()
        if (side === 1) {
          ctx.moveTo(bx + size, CTA_Y + dy - size * 0.5)
          ctx.lineTo(bx, CTA_Y + dy)
          ctx.lineTo(bx + size, CTA_Y + dy + size * 0.5)
        } else {
          ctx.moveTo(bx - size, CTA_Y + dy - size * 0.5)
          ctx.lineTo(bx, CTA_Y + dy)
          ctx.lineTo(bx - size, CTA_Y + dy + size * 0.5)
        }
        ctx.stroke(); ctx.restore()
      })
    })

    ctx.font = `bold 84px ${F}`; ctx.textAlign = 'center'
    gradientText(ctx, isHot ? '🔥 熱門投票' : showStats ? '你也來投票！' : '快來幫我選！', W / 2, CTA_Y + 88)
    ctx.font = `38px ${F}`; ctx.fillStyle = 'rgba(255,255,255,0.42)'
    ctx.fillText(showStats ? '做不了決定？世界幫你選 ⚡' : `已有 ${props.totalVotes} 票，快來加入！`, W / 2, CTA_Y + 156)

    // ── Footer pill ──
    const FT_W = W - 80, FT_X = 40
    const ftg = ctx.createLinearGradient(FT_X, 0, FT_X + FT_W, 0)
    ftg.addColorStop(0, '#6D28D9'); ftg.addColorStop(0.5, '#DB2777'); ftg.addColorStop(1, '#EA580C')
    ctx.fillStyle = ftg
    roundRect(ctx, FT_X, FT_Y, FT_W, FT_H, FT_H / 2); ctx.fill()

    const IR = 48, IX = FT_X + 58 + IR, IY = FT_Y + FT_H / 2
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath(); ctx.arc(IX, IY, IR, 0, Math.PI * 2); ctx.fill()
    ctx.font = '46px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF'
    ctx.fillText('🔗', IX, IY + 16)

    const domX = IX + IR + 22
    ctx.font = `bold 68px ${F}`; ctx.textAlign = 'left'; ctx.fillStyle = '#FFF'
    const vsW = ctx.measureText('votesnap').width
    ctx.fillText('votesnap', domX, IY + 24)
    ctx.fillStyle = '#FED7AA'
    ctx.fillText('.online', domX + vsW, IY + 24)

    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
  })
}

export default function ShareModal({ question, optionA, optionB, pctA, pctB, totalVotes, displayName, resultUrl, onClose }: Props) {
  const [savingImg, setSavingImg] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const shareUrl = `https://votesnap.online/result/${resultUrl.split('/result/')[1] ?? ''}`
  const shareText = `${displayName ? `${displayName} 問：` : ''}「${question}」\n${optionA} ${pctA}% vs ${optionB} ${pctB}%\n快來投票！👉 ${shareUrl}`

  useEffect(() => {
    let url = ''
    generateShareImage({ question, optionA, optionB, pctA, pctB, totalVotes, displayName })
      .then(blob => { url = URL.createObjectURL(blob); setPreviewUrl(url) })
      .catch(console.error)
    return () => { if (url) URL.revokeObjectURL(url) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function savePhoto() {
    setSavingImg(true)
    try {
      const blob = await generateShareImage({ question, optionA, optionB, pctA, pctB, totalVotes, displayName })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'votesnap-result.png'
      a.click()
      URL.revokeObjectURL(a.href)
    } finally {
      setSavingImg(false)
    }
  }

  function shareToThreads() {
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`, '_blank')
  }

  function shareToLine() {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-sm bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">分享結果</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Preview — actual rendered canvas image */}
        <div className="flex justify-center mb-5 px-6">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="分享預覽"
              className="rounded-2xl shadow-2xl"
              style={{ height: 260, width: 'auto' }}
            />
          ) : (
            <div
              className="rounded-2xl bg-white/5 animate-pulse"
              style={{ height: 260, aspectRatio: '9/16' }}
            />
          )}
        </div>

        {/* 3 share buttons */}
        <div className="px-8 pb-10 grid grid-cols-3 gap-6">
          <button onClick={savePhoto} disabled={savingImg} className="flex flex-col items-center gap-2 disabled:opacity-50">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-16 h-16">
                <defs><radialGradient id="ig3" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
                <rect width="24" height="24" rx="6" fill="url(#ig3)"/>
                <path fill="white" d="M12 7a5 5 0 100 10A5 5 0 0012 7zm0 8a3 3 0 110-6 3 3 0 010 6zm5.2-8.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-[11px] font-medium">{savingImg ? '儲存中...' : 'Instagram'}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">儲存後貼至限時動態</p>
            </div>
          </button>

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
