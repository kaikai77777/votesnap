'use client'

import { useRef, useState, useCallback } from 'react'

interface Props {
  question: string
  optionA: string
  optionB: string
  pctA: number
  pctB: number
  totalVotes: number
  resultUrl: string
  onClose: () => void
}

function generateImage(props: Omit<Props, 'onClose' | 'resultUrl'>): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1080, H = 1080
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = '#0D0D10'
    ctx.fillRect(0, 0, W, H)

    // Subtle gradient overlay
    const grad = ctx.createRadialGradient(W * 0.2, H * 0.2, 0, W * 0.5, H * 0.5, W * 0.8)
    grad.addColorStop(0, 'rgba(139,92,246,0.15)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Card background
    const r = 48
    ctx.fillStyle = '#18181C'
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 2
    roundRect(ctx, 60, 60, W - 120, H - 180, r)
    ctx.fill(); ctx.stroke()

    // VoteSnap logo text
    ctx.font = 'bold 44px -apple-system, system-ui, sans-serif'
    ctx.fillStyle = '#9B73F7'
    ctx.textAlign = 'left'
    ctx.fillText('vote', 120, 168)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('snap', 120 + ctx.measureText('vote').width, 168)

    // Question
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 72px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    const lines = wrapText(ctx, props.question, W - 240)
    const lineH = 90
    const textY = 340 - ((lines.length - 1) * lineH) / 2
    lines.forEach((line, i) => ctx.fillText(line, W / 2, textY + i * lineH))

    // Bars
    const barY = lines.length > 1 ? 540 : 480
    drawBar(ctx, props.optionA, props.pctA, props.pctA >= props.pctB, true, 120, barY, W - 240)
    drawBar(ctx, props.optionB, props.pctB, props.pctB > props.pctA, false, 120, barY + 160, W - 240)

    // Total votes
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '36px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`總投票數：${props.totalVotes} 票`, W / 2, barY + 330)

    // Footer gradient bar
    const footerGrad = ctx.createLinearGradient(60, 0, W - 60, 0)
    footerGrad.addColorStop(0, '#7C3AED')
    footerGrad.addColorStop(0.5, '#EC4899')
    footerGrad.addColorStop(1, '#F97316')
    ctx.fillStyle = footerGrad
    roundRectBottom(ctx, 60, H - 180, W - 120, 120, 48)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 38px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('votesnap.online', W / 2, H - 108)
    ctx.font = '30px -apple-system, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText('做不了決定？丟到 VoteSnap，世界幫你選 ⚡', W / 2, H - 66)

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

export default function ShareModal({ question, optionA, optionB, pctA, pctB, totalVotes, resultUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [savingImg, setSavingImg] = useState(false)
  const [shareText, setShareText] = useState(
    `我在 VoteSnap 投票了：「${question}」\n結果是 ${optionA} ${pctA}% / ${optionB} ${pctB}% 😎\n快來投票，幫我做決定吧！\n👉 ${resultUrl}`
  )

  async function getImageBlob() {
    return generateImage({ question, optionA, optionB, pctA, pctB, totalVotes })
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
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(resultUrl)}&text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(resultUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function copyText() {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  async function shareMore() {
    try {
      await navigator.share({ title: question, text: shareText, url: resultUrl })
    } catch { /* cancelled */ }
  }

  function downloadBlob(blob: Blob) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'votesnap-result.png'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const shareActions = [
    {
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig)"/><path fill="white" d="M12 7a5 5 0 100 10A5 5 0 0012 7zm0 8a3 3 0 110-6 3 3 0 010 6zm5.2-8.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/></svg>
      ),
      onClick: shareToInstagram,
    },
    {
      label: 'Threads',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><rect width="24" height="24" rx="6" fill="#000"/><path d="M16.26 11.44a4.54 4.54 0 00-.27-.12c-.16-2.17-1.3-3.41-3.28-3.42h-.03c-1.18 0-2.16.5-2.77 1.42l1.12.77c.45-.68 1.15-.82 1.65-.82h.02c.64 0 1.12.19 1.42.56.22.27.37.65.43 1.13a7.8 7.8 0 00-1.8-.1c-1.81.1-2.97 1.14-2.9 2.58.04.73.41 1.36.99 1.77.5.35 1.14.52 1.8.49 .88-.05 1.57-.4 2.07-1.03.38-.49.62-1.12.72-1.93.43.26.75.6.93 1.02.3.67.31 1.77-.6 2.68-.8.79-1.76 1.13-3.22 1.14-1.62-.01-2.84-.53-3.62-1.55-.74-.96-1.12-2.33-1.13-4.06.01-1.73.39-3.1 1.13-4.06.78-1.02 2-1.54 3.62-1.55 1.64.01 2.87.55 3.66 1.59.38.5.67 1.1.86 1.8l1.3-.35c-.23-.88-.6-1.64-1.1-2.27C15.36 6.68 13.81 6 11.93 6h-.04C10.02 6 8.46 6.68 7.4 7.98 6.46 9.15 5.98 10.8 5.97 12.82c.01 2.02.49 3.67 1.43 4.84C8.46 19.01 10.02 19.7 11.9 19.7h.04c1.7-.01 2.96-.46 3.97-1.46 1.32-1.3 1.28-2.93.84-3.93-.3-.68-.88-1.24-1.49-1.57v-.3zm-4.4 3.05c-.79.04-1.62-.31-1.65-1.09-.02-.58.41-1.22 1.74-1.3.15-.01.3-.01.44-.01.47 0 .91.05 1.31.13-.15 1.87-.98 2.23-1.84 2.27z" fill="white"/></svg>
      ),
      onClick: shareToThreads,
    },
    {
      label: '複製連結',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-[#2C2C2E] flex items-center justify-center">
          {copied ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
          )}
        </div>
      ),
      onClick: copyLink,
      rawIcon: true,
    },
    {
      label: 'LINE',
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7"><rect width="24" height="24" rx="6" fill="#06C755"/><path fill="white" d="M12 4.5C7.86 4.5 4.5 7.3 4.5 10.75c0 2.95 2.62 5.42 6.16 5.89.24.05.57.16.65.36.07.18.05.47.02.65l-.1.62c-.03.18-.15.72.63.39.78-.33 4.2-2.47 5.73-4.23A5.1 5.1 0 0019.5 10.75C19.5 7.3 16.14 4.5 12 4.5zm-2.62 7.88H7.9a.38.38 0 01-.38-.38V9.25a.38.38 0 01.76 0v2.37h1.1a.38.38 0 010 .76zm1.37 0a.38.38 0 01-.76 0V9.25a.38.38 0 01.76 0v3.13zm3.4 0a.38.38 0 01-.34-.2l-1.43-1.95v1.77a.38.38 0 01-.76 0V9.25a.38.38 0 01.71-.2l1.44 1.96V9.25a.38.38 0 01.76 0v3.13a.38.38 0 01-.38.38v.02zm2.17 0h-1.5a.38.38 0 01-.38-.38V9.25a.38.38 0 01.76 0v2.75h1.12a.38.38 0 010 .76v.12z"/></svg>
      ),
      onClick: shareToLine,
    },
    {
      label: savingImg ? '儲存中...' : '儲存照片',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-[#2C2C2E] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
      ),
      onClick: savePhoto,
      rawIcon: true,
    },
    {
      label: '更多',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-[#2C2C2E] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12v.01M12 12v.01M20 12v.01M4 6v.01M12 6v.01M20 6v.01M4 18v.01M12 18v.01M20 18v.01"/></svg>
        </div>
      ),
      onClick: shareMore,
      rawIcon: true,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">分享你的投票結果！</h2>
            <p className="text-gray-400 text-sm mt-0.5">看看大家怎麼說，分享給朋友吧 🎉</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Preview card */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background: '#0D0D10', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                </div>
                <span className="text-xs font-bold"><span className="text-violet-400">vote</span><span className="text-white">snap</span></span>
              </div>
              <span className="text-[10px] text-gray-500">已結束 · 結果</span>
            </div>
            <p className="text-white font-bold text-base mb-3 text-center">{question}</p>
            <div className="space-y-2.5">
              {[{ label: optionA, pct: pctA, winner: pctA >= pctB, gradient: true }, { label: optionB, pct: pctB, winner: pctB > pctA, gradient: false }].map(o => (
                <div key={o.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={o.winner ? 'text-white font-semibold' : 'text-gray-500'}>{o.label}</span>
                    <span className={o.winner ? 'text-white font-bold' : 'text-gray-500'}>{o.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${o.gradient ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400' : 'bg-white/20'}`} style={{ width: `${o.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-[10px] mt-2">總投票數：{totalVotes} 票</p>
          </div>
          <div className="h-10 flex items-center justify-center px-4" style={{ background: 'linear-gradient(90deg,#7C3AED,#EC4899,#F97316)' }}>
            <span className="text-white text-xs font-medium">做不了決定？丟到 VoteSnap，世界幫你選 ⚡</span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="px-5 mb-4">
          <p className="text-gray-500 text-xs text-center mb-3">選擇分享方式</p>
          <div className="grid grid-cols-6 gap-2">
            {shareActions.map(action => (
              <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-1.5 group">
                {action.rawIcon ? (
                  action.icon
                ) : (
                  <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-[#2C2C2E] group-hover:opacity-80 transition">
                    {action.icon}
                  </div>
                )}
                <span className="text-gray-400 text-[10px] leading-tight text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Share text */}
        <div className="mx-5 mb-5 bg-[#2C2C2E] rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-2">分享文字（可自訂）</p>
          <textarea
            value={shareText}
            onChange={e => setShareText(e.target.value)}
            rows={4}
            className="w-full bg-transparent text-white text-sm resize-none focus:outline-none leading-relaxed"
          />
          <div className="flex justify-end mt-2">
            <button onClick={copyText}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs rounded-xl transition font-medium">
              {copied ? '已複製 ✓' : '複製文字'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
