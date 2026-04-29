import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const QUESTIONS_PER_RUN = 2

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botUserId = process.env.BOT_USER_ID
  if (!botUserId) return NextResponse.json({ error: 'BOT_USER_ID not set' }, { status: 500 })

  const admin = createAdminClient()

  const { data: bank } = await admin.from('question_bank').select('*')
  if (!bank || bank.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, note: 'Question bank is empty' })
  }

  const { data: posted } = await admin
    .from('questions')
    .select('question_text, option_a, option_b')
    .eq('user_id', botUserId)

  const postedKeys = new Set(
    (posted ?? []).map(q => `${q.question_text}|${q.option_a}|${q.option_b}`)
  )

  const available = bank.filter(q =>
    !postedKeys.has(`${q.question_text}|${q.option_a}|${q.option_b}`)
  )

  if (available.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, note: 'All questions have been posted' })
  }

  // Priority questions first, then FIFO by created_at
  const priority = available.filter(q => q.is_priority)
  const normal = available.filter(q => !q.is_priority)
  normal.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const sorted = [...priority, ...normal]
  const picks = sorted.slice(0, Math.min(QUESTIONS_PER_RUN, sorted.length))

  const now = Date.now()
  const rows = picks.map((q, i) => ({
    user_id: botUserId,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    category: q.category,
    duration_minutes: q.duration_minutes,
    status: 'active',
    image_urls: [],
    expires_at: new Date(now + q.duration_minutes * 60 * 1000 + i * 60 * 1000).toISOString(),
  }))

  const { error } = await admin.from('questions').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clear is_priority on posted questions
  const priorityIds = picks.filter(q => q.is_priority).map(q => q.id)
  if (priorityIds.length > 0) {
    await admin.from('question_bank').update({ is_priority: false }).in('id', priorityIds)
  }

  return NextResponse.json({
    ok: true,
    posted: rows.length,
    remaining: available.length - rows.length,
    questions: picks.map(q => q.question_text),
  })
}
