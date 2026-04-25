import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question_id } = await req.json()
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
  if (!profile?.is_pro) return NextResponse.json({ error: 'Pro required' }, { status: 403 })

  const { data: q } = await supabase
    .from('questions')
    .select('id, user_id, expires_at, status')
    .eq('id', question_id)
    .single()

  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (q.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (q.status !== 'active') return NextResponse.json({ error: 'Question not active' }, { status: 400 })

  const newExpiry = new Date(new Date(q.expires_at).getTime() + 30 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('questions')
    .update({ expires_at: newExpiry })
    .eq('id', question_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expires_at: newExpiry })
}
