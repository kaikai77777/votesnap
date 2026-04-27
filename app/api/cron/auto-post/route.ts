import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const QUESTIONS_PER_RUN = 3

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botUserId = process.env.BOT_USER_ID
  if (!botUserId) return NextResponse.json({ error: 'BOT_USER_ID not set' }, { status: 500 })

  const admin = createAdminClient()

  // Get all bank questions
  const { data: bank } = await admin.from('question_bank').select('*')
  if (!bank || bank.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, note: 'Question bank is empty' })
  }

  // Get all combinations already posted by bot (never repeat)
  const { data: posted } = await admin
    .from('questions')
    .select('question_text, option_a, option_b')
    .eq('user_id', botUserId)

  const postedKeys = new Set(
    (posted ?? []).map(q => `${q.question_text}|${q.option_a}|${q.option_b}`)
  )

  // Filter out already-posted combinations
  const available = bank.filter(q =>
    !postedKeys.has(`${q.question_text}|${q.option_a}|${q.option_b}`)
  )

  if (available.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, note: 'All questions have been posted — add more to the bank' })
  }

  // Pick randomly
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  const picks = shuffled.slice(0, Math.min(QUESTIONS_PER_RUN, available.length))

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

  return NextResponse.json({
    ok: true,
    posted: rows.length,
    remaining: available.length - rows.length,
    questions: picks.map(q => q.question_text),
  })
}
