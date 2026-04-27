import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Fetch all reports
  const { data: reports, error: reportErr } = await admin
    .from('reports')
    .select('question_id, reason, created_at')
    .order('created_at', { ascending: false })

  if (reportErr) return NextResponse.json({ error: reportErr.message }, { status: 500 })
  if (!reports || reports.length === 0) return NextResponse.json([])

  // Aggregate by question_id
  const countMap: Record<string, { count: number; reasons: string[]; latest: string }> = {}
  for (const r of reports) {
    const qid = r.question_id
    if (!countMap[qid]) countMap[qid] = { count: 0, reasons: [], latest: r.created_at }
    countMap[qid].count++
    if (r.reason && !countMap[qid].reasons.includes(r.reason)) countMap[qid].reasons.push(r.reason)
  }

  const questionIds = Object.keys(countMap)
  const { data: questions, error: qErr } = await admin
    .from('questions')
    .select('id, question_text, option_a, option_b, status, created_at, user_id, category')
    .in('id', questionIds)

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  const result = (questions ?? []).map(q => ({
    ...q,
    reportCount: countMap[q.id]?.count ?? 0,
    reasons: countMap[q.id]?.reasons ?? [],
    latestReport: countMap[q.id]?.latest ?? '',
  })).sort((a, b) => b.reportCount - a.reportCount)

  return NextResponse.json(result)
}
