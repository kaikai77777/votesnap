import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL ? user : null
}

export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('question_bank')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { question_text, option_a, option_b, category, duration_minutes } = body

  if (!question_text?.trim() || !option_a?.trim() || !option_b?.trim() || !category) {
    return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('question_bank')
    .insert({ question_text: question_text.trim(), option_a: option_a.trim(), option_b: option_b.trim(), category, duration_minutes: duration_minutes ?? 1440 })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '此題目組合已存在於題庫' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
