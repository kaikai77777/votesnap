import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()

  // Verify ownership
  const { data: question, error: fetchErr } = await admin
    .from('questions')
    .select('user_id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !question) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (question.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (question.status === 'deleted') return NextResponse.json({ ok: true }) // already deleted

  const { error } = await admin
    .from('questions')
    .update({ status: 'deleted' })
    .eq('id', id)
    .eq('user_id', user.id) // double-lock ownership

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
