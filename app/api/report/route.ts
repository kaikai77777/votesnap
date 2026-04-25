import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question_id, reason } = await req.json()
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  const { error } = await supabase
    .from('reports')
    .insert({ question_id, reporter_id: user.id, reason: reason ?? null })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
