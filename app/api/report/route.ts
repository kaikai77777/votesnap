import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { question_id, reason, anonymous_id } = await req.json()
  if (!question_id) return NextResponse.json({ error: 'Missing question_id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { error } = await admin
    .from('reports')
    .insert({
      question_id,
      reporter_id: user?.id ?? null,
      anonymous_id: user ? null : (anonymous_id ?? null),
      reason: reason ?? null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
