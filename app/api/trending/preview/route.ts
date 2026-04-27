import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 300 // cache 5 minutes

export async function GET() {
  const admin = createAdminClient()

  // Get recent non-deleted questions (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: questions } = await admin
    .from('questions')
    .select('id, question_text, option_a, option_b')
    .neq('status', 'deleted')
    .gte('created_at', since)
    .limit(100)

  if (!questions || questions.length === 0) {
    return NextResponse.json([])
  }

  const { data: votes } = await admin
    .from('votes')
    .select('question_id, vote')
    .in('question_id', questions.map(q => q.id))

  const countMap: Record<string, { a: number; b: number }> = {}
  for (const v of votes ?? []) {
    if (!countMap[v.question_id]) countMap[v.question_id] = { a: 0, b: 0 }
    if (v.vote === 'A') countMap[v.question_id].a++
    else countMap[v.question_id].b++
  }

  const ranked = questions
    .map(q => {
      const { a, b } = countMap[q.id] ?? { a: 0, b: 0 }
      const total = a + b
      return {
        id: q.id,
        text: q.question_text,
        optA: q.option_a,
        optB: q.option_b,
        pctA: total > 0 ? Math.round((a / total) * 100) : 50,
        pctB: total > 0 ? Math.round((b / total) * 100) : 50,
        votes: total,
      }
    })
    .filter(q => q.votes >= 5)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3)

  return NextResponse.json(ranked)
}
