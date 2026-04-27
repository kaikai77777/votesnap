import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const { data: reports } = await admin
    .from('reports')
    .select('question_id, reason, created_at')
    .order('created_at', { ascending: false })

  if (!reports || reports.length === 0) return NextResponse.json([])

  // Group by question_id and count
  const countMap: Record<string, { count: number; reasons: string[] }> = {}
  for (const r of reports) {
    if (!countMap[r.question_id]) countMap[r.question_id] = { count: 0, reasons: [] }
    countMap[r.question_id].count++
    if (r.reason) countMap[r.question_id].reasons.push(r.reason)
  }

  const questionIds = Object.keys(countMap)
  const { data: questions } = await admin
    .from('questions')
    .select('id, question_text, option_a, option_b, status, created_at, user_id, category')
    .in('id', questionIds)

  const result = (questions ?? []).map(q => ({
    ...q,
    reportCount: countMap[q.id]?.count ?? 0,
    reasons: countMap[q.id]?.reasons ?? [],
  })).sort((a, b) => b.reportCount - a.reportCount)

  return NextResponse.json(result)
}
