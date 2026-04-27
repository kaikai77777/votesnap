import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

// Cron fires at UTC 0-14 (TW 8am-10pm)
function getNextFireTime(): Date {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const utcMin = now.getUTCMinutes()
  const next = new Date(now)
  next.setUTCMinutes(0, 0, 0)

  if (utcHour < 14 || (utcHour === 14 && utcMin === 0)) {
    // still within window — next hour if already past :00
    next.setUTCHours(utcHour + (utcMin > 0 ? 1 : 0))
    if (next.getUTCHours() > 14) {
      // past window, jump to next day 00:00 UTC
      next.setUTCDate(next.getUTCDate() + 1)
      next.setUTCHours(0, 0, 0, 0)
    }
  } else {
    // past today's window — next fire is tomorrow 00:00 UTC
    next.setUTCDate(next.getUTCDate() + 1)
    next.setUTCHours(0, 0, 0, 0)
  }
  return next
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const botUserId = process.env.BOT_USER_ID
  const admin = createAdminClient()

  const [bankRes, postedRes] = await Promise.all([
    admin.from('question_bank').select('*').order('created_at', { ascending: true }),
    botUserId
      ? admin.from('questions').select('question_text, option_a, option_b').eq('user_id', botUserId)
      : Promise.resolve({ data: [] }),
  ])

  const bank = bankRes.data ?? []
  const postedKeys = new Set(
    ((postedRes as { data: { question_text: string; option_a: string; option_b: string }[] | null }).data ?? [])
      .map((q: { question_text: string; option_a: string; option_b: string }) => `${q.question_text}|${q.option_a}|${q.option_b}`)
  )

  const available = bank.filter(q => !postedKeys.has(`${q.question_text}|${q.option_a}|${q.option_b}`))

  // Mirror cron logic: priority first, then FIFO
  const priority = available.filter((q: { is_priority: boolean }) => q.is_priority)
  const normal = available.filter((q: { is_priority: boolean }) => !q.is_priority)
  normal.sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const sorted = [...priority, ...normal]
  const nextQuestions = sorted.slice(0, 3)

  return NextResponse.json({
    nextFireAt: getNextFireTime().toISOString(),
    bankTotal: bank.length,
    remaining: available.length,
    nextQuestions,
  })
}
