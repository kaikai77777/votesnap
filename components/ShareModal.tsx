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

function generateImage(props: Omit<Props, 'onClose' | 'resultUrl' | 'displayName'> & { displayName?: string | null }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 9:16 — Instagram Stories / Reels
    const W = 1080, H = 1920
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = '#0D0D10'
    ctx.fillRect(0, 0, W, H)

    // Radial glow top-left
    const grad = ctx.createRadialGradient(W * 0.15, H * 0.12, 0, W * 0.5, H * 0.35, W * 0.9)
    grad.addColorStop(0, 'rgba(139,92,246,0.18)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Radial glow bottom-right
    const grad2 = ctx.createRadialGradient(W * 0.85, H * 0.75, 0, W * 0.5, H * 0.65, W * 0.9)
    grad2.addColorStop(0, 'rgba(249,115,22,0.12)')
    grad2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad2
    ctx.fillRect(0, 0, W, H)

    // ── Top gradient bar ──
    const topBar = ctx.createLinearGradient(0, 0, W, 0)
    topBar.addColorStop(0, '#7C3AED')
    topBar.addColorStop(0.5, '#EC4899')
    topBar.addColorStop(1, '#F97316')
    ctx.fillStyle = topBar
    ctx.fillRect(0, 0, W, 12)

    // ── Logo ──
    const LOGO_Y = 120
    ctx.font = 'bold 68px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    const voteW = ctx.measureText('vote').width
    const snapW = ctx.measureText('snap').width
    const totalW = voteW + snapW
    const logoX = (W - totalW) / 2
    ctx.fillStyle = '#9B73F7'
    ctx.textAlign = 'left'
    ctx.fillText('vote', logoX, LOGO_Y)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('snap', logoX + voteW, LOGO_Y)

    // ── Card ──
    const CX = 80, CY = 200, CW = W - 160, CH = 1100, CR = 60
    ctx.fillStyle = '#18181C'
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'
    ctx.lineWidth = 2
    roundRect(ctx, CX, CY, CW, CH, CR)
    ctx.fill(); ctx.stroke()

    // Question label — include name if available
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '36px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    const labelText = props.displayName ? `${props.displayName} 想知道大家怎麼想` : '大家覺得呢？'
    ctx.fillText(labelText, W / 2, CY + 80)

    // Question text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 82px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    const lines = wrapText(ctx, props.question, CW - 100)
    const lineH = 100
    const textStartY = CY + 200
    lines.forEach((line, i) => ctx.fillText(line, W / 2, textStartY + i * lineH))

    // Bars
    const barY = textStartY + lines.length * lineH + 80
    drawBar(ctx, props.optionA, props.pctA, props.pctA >= props.pctB, true, CX + 60, barY, CW - 120)
    drawBar(ctx, props.optionB, props.pctB, props.pctB > props.pctA, false, CX + 60, barY + 200, CW - 120)

    // Total votes
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '40px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`共 ${props.totalVotes} 票`, W / 2, barY + 410)

    // ── CTA section ──
    const ctaY = CY + CH + 80
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 56px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('你也來投票！', W / 2, ctaY)

    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '42px -apple-system, system-ui, sans-serif'
    ctx.fillText('做不了決定？世界幫你選 ⚡', W / 2, ctaY + 70)

    // ── Bottom gradient footer ──
    const footerH = 140
    const footerY = H - footerH
    const footerGrad = ctx.createLinearGradient(0, 0, W, 0)
    footerGrad.addColorStop(0, '#7C3AED')
    footerGrad.addColorStop(0.5, '#EC4899')
    footerGrad.addColorStop(1, '#F97316')
    ctx.fillStyle = footerGrad
    ctx.fillRect(0, footerY, W, footerH)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 52px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🔗 votesnap.online', W / 2, footerY + 90)

    canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas toBlob failed')), 'image/png')
  })
}

function drawBar(ctx: CanvasRenderingContext2D, label: string, pct: number, isWinner: boolean, gradient: boolean, x: number, y: number, w: number) {
  // Label + pct
  ctx.textAlign = 'left'
  ctx.font = `${isWinner ? 'bold' : 'normal'} 44px -apple-system, system-ui, sans-serif`
  ctx.fillStyle = isWinner ? '#FFFFFF' : '#6B7280'
  ctx.fillText(label, x, y)

  ctx.textAlign = 'right'
  ctx.font = `bold ${isWinner ? '56' : '44'}px -apple-system, system-ui, sans-serif`
  ctx.fillStyle = isWinner ? '#FFFFFF' : '#4B5563'
  ctx.fillText(`${pct}%`, x + w, y)

  // Track
  const barH = 28, barY = y + 20
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  roundRect(ctx, x, barY, w, barH, barH / 2)
  ctx.fill()

  // Fill
  if (gradient) {
    const g = ctx.createLinearGradient(x, 0, x + w * (pct / 100), 0)
    g.addColorStop(0, '#7C3AED')
    g.addColorStop(0.5, '#EC4899')
    g.addColorStop(1, '#F97316')
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
  }
  roundRect(ctx, x, barY, Math.max(w * (pct / 100), barH), barH, barH / 2)
  ctx.fill()
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

function roundRectBottom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y)
  ctx.closePath()
}

export default function ShareModal({ question, optionA, optionB, pctA, pctB, totalVotes, displayName, resultUrl, onClose }: Props) {
  const [savingImg, setSavingImg] = useState(false)
  const shareUrl = `https://votesnap.online/result/${resultUrl.split('/result/')[1] ?? ''}`
  const shareText = `${displayName ? `${displayName} 問：` : ''}「${question}」\n${optionA} ${pctA}% vs ${optionB} ${pctB}%\n快來投票！👉 ${shareUrl}`

  async function getImageBlob() {
    return generateImage({ question, optionA, optionB, pctA, pctB, totalVotes, displayName })
  }

  async function shareToInstagram() {
    try {
      const blob = await getImageBlob()
      const file = new File([blob], 'votesnap.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: question })
      } else {
        downloadBlob(blob)
      }
    } catch { /* user cancelled */ }
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

        {/* 4 share buttons */}
        <div className="px-6 pb-10 grid grid-cols-4 gap-3">
          {/* 下載照片 */}
          <button onClick={savePhoto} disabled={savingImg} className="flex flex-col items-center gap-2 disabled:opacity-50">
            <div className="w-14 h-14 rounded-2xl bg-[#2C2C2E] flex items-center justify-center hover:bg-white/10 transition">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </div>
            <span className="text-gray-400 text-[11px]">{savingImg ? '儲存中' : '下載照片'}</span>
          </button>

          {/* Instagram */}
          <button onClick={shareToInstagram} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-14 h-14">
                <defs><radialGradient id="ig2" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
                <rect width="24" height="24" rx="6" fill="url(#ig2)"/>
                <path fill="white" d="M12 7a5 5 0 100 10A5 5 0 0012 7zm0 8a3 3 0 110-6 3 3 0 010 6zm5.2-8.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/>
              </svg>
            </div>
            <span className="text-gray-400 text-[11px]">Instagram</span>
          </button>

          {/* Threads */}
          <button onClick={shareToThreads} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-14 h-14">
                <rect width="24" height="24" rx="6" fill="#000"/>
                <path d="M16.26 11.44a4.54 4.54 0 00-.27-.12c-.16-2.17-1.3-3.41-3.28-3.42h-.03c-1.18 0-2.16.5-2.77 1.42l1.12.77c.45-.68 1.15-.82 1.65-.82h.02c.64 0 1.12.19 1.42.56.22.27.37.65.43 1.13a7.8 7.8 0 00-1.8-.1c-1.81.1-2.97 1.14-2.9 2.58.04.73.41 1.36.99 1.77.5.35 1.14.52 1.8.49.88-.05 1.57-.4 2.07-1.03.38-.49.62-1.12.72-1.93.43.26.75.6.93 1.02.3.67.31 1.77-.6 2.68-.8.79-1.76 1.13-3.22 1.14-1.62-.01-2.84-.53-3.62-1.55-.74-.96-1.12-2.33-1.13-4.06.01-1.73.39-3.1 1.13-4.06.78-1.02 2-1.54 3.62-1.55 1.64.01 2.87.55 3.66 1.59.38.5.67 1.1.86 1.8l1.3-.35c-.23-.88-.6-1.64-1.1-2.27C15.36 6.68 13.81 6 11.93 6h-.04C10.02 6 8.46 6.68 7.4 7.98 6.46 9.15 5.98 10.8 5.97 12.82c.01 2.02.49 3.67 1.43 4.84C8.46 19.01 10.02 19.7 11.9 19.7h.04c1.7-.01 2.96-.46 3.97-1.46 1.32-1.3 1.28-2.93.84-3.93-.3-.68-.88-1.24-1.49-1.57v-.3zm-4.4 3.05c-.79.04-1.62-.31-1.65-1.09-.02-.58.41-1.22 1.74-1.3.15-.01.3-.01.44-.01.47 0 .91.05 1.31.13-.15 1.87-.98 2.23-1.84 2.27z" fill="white"/>
              </svg>
            </div>
            <span className="text-gray-400 text-[11px]">Threads</span>
          </button>

          {/* LINE */}
          <button onClick={shareToLine} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-14 h-14">
                <rect width="24" height="24" rx="6" fill="#06C755"/>
                <path fill="white" d="M12 4.5C7.86 4.5 4.5 7.3 4.5 10.75c0 2.95 2.62 5.42 6.16 5.89.24.05.57.16.65.36.07.18.05.47.02.65l-.1.62c-.03.18-.15.72.63.39.78-.33 4.2-2.47 5.73-4.23A5.1 5.1 0 0019.5 10.75C19.5 7.3 16.14 4.5 12 4.5zm-2.62 7.88H7.9a.38.38 0 01-.38-.38V9.25a.38.38 0 01.76 0v2.37h1.1a.38.38 0 010 .76zm1.37 0a.38.38 0 01-.76 0V9.25a.38.38 0 01.76 0v3.13zm3.4 0a.38.38 0 01-.34-.2l-1.43-1.95v1.77a.38.38 0 01-.76 0V9.25a.38.38 0 01.71-.2l1.44 1.96V9.25a.38.38 0 01.76 0v3.13a.38.38 0 01-.38.38v.02zm2.17 0h-1.5a.38.38 0 01-.38-.38V9.25a.38.38 0 01.76 0v2.75h1.12a.38.38 0 010 .76v.12z"/>
              </svg>
            </div>
            <span className="text-gray-400 text-[11px]">LINE</span>
          </button>
        </div>
      </div>
    </div>
  )
}
