import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  // Vercel Cron auth check
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()

  // Questions that expired in the last 10 min (called every 5 min via Supabase pg_cron)
  const { data: expired } = await supabase
    .from('questions')
    .select('id, user_id, question_text, option_a, option_b')
    .eq('status', 'active')
    .lte('expires_at', now.toISOString())
    .gte('expires_at', tenMinAgo)

  if (!expired || expired.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const q of expired) {
    // Mark as ended
    await supabase.from('questions').update({ status: 'ended' }).eq('id', q.id)

    // Get vote stats
    const { data: votes } = await supabase
      .from('votes').select('vote').eq('question_id', q.id)
    const total = votes?.length ?? 0
    const a = votes?.filter(v => v.vote === 'A').length ?? 0
    const pctA = total > 0 ? Math.round((a / total) * 100) : 0

    // Get user email from auth.users
    const { data: { user } } = await supabase.auth.admin.getUserById(q.user_id)
    if (!user?.email) continue

    await resend.emails.send({
      from: 'votesnap <notify@votesnap.online>',
      to: user.email,
      subject: `你的問題結束了！「${q.question_text}」`,
      html: `
        <div style="font-family:sans-serif;background:#0C0C18;color:#fff;padding:40px;border-radius:16px;max-width:520px;">
          <h2 style="margin:0 0 8px;font-size:22px;">投票結果出來了 🎉</h2>
          <p style="color:#9CA3AF;margin:0 0 24px;font-size:15px;">你的問題已結束</p>
          <div style="background:#13131B;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="font-size:17px;font-weight:700;margin:0 0 16px;">${q.question_text}</p>
            <div style="margin-bottom:8px;">
              <span style="color:#EC4899;font-size:28px;font-weight:800;">${pctA}%</span>
              <span style="color:#9CA3AF;font-size:14px;margin-left:8px;">${q.option_a}</span>
            </div>
            <div>
              <span style="color:#6B7280;font-size:28px;font-weight:800;">${100 - pctA}%</span>
              <span style="color:#9CA3AF;font-size:14px;margin-left:8px;">${q.option_b}</span>
            </div>
            <p style="color:#6B7280;font-size:13px;margin:16px 0 0;">共 ${total} 票</p>
          </div>
          <a href="https://votesnap.online/result/${q.id}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:15px;">查看完整結果 →</a>
        </div>
      `,
    })
    sent++
  }

  return NextResponse.json({ sent })
}
