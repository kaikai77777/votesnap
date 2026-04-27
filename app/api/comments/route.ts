import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const questionId = req.nextUrl.searchParams.get('questionId')
  if (!questionId) return NextResponse.json([], { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('comments')
    .select('id, display_name, content, created_at, user_id')
    .eq('question_id', questionId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { questionId, content, displayName, anonymousId } = await req.json()
  if (!questionId || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (content.trim().length > 200) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data, error } = await admin.from('comments').insert({
    question_id: questionId,
    user_id: user?.id ?? null,
    anonymous_id: user ? null : (anonymousId ?? null),
    display_name: displayName?.trim() || (user ? null : '匿名'),
    content: content.trim(),
  }).select('id, display_name, content, created_at, user_id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
