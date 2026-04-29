import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { questionId, vote, anonymousId } = await req.json()

  if (!questionId || !vote) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const admin = createAdminClient()

  // Check question is still active (admin bypasses RLS)
  const { data: q } = await admin
    .from('questions')
    .select('status, expires_at')
    .eq('id', questionId)
    .single()

  if (!q || q.status !== 'active' || new Date(q.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Question is no longer active', code: 'EXPIRED' }, { status: 400 })
  }

  // Insert vote via admin client (bypasses RLS completely)
  const { data, error } = await admin
    .from('votes')
    .insert({
      question_id: questionId,
      user_id: userId ?? null,
      anonymous_id: userId ? null : (anonymousId ?? null),
      vote,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already voted', code: '23505' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
