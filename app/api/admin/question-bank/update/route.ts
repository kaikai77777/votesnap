import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, question_text, option_a, option_b, category, duration_minutes } = await req.json().catch(() => ({}))
  if (!id || !question_text?.trim() || !option_a?.trim() || !option_b?.trim()) {
    return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('question_bank')
    .update({ question_text: question_text.trim(), option_a: option_a.trim(), option_b: option_b.trim(), category, duration_minutes })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '此題目組合已存在於題庫' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
