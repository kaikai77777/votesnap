import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''

  let query = admin
    .from('questions')
    .select('id, question_text, option_a, option_b, status, created_at, user_id, category, expires_at')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('question_text', `%${search}%`)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('questions').update({ status: 'deleted' }).eq('id', id)
  await admin.from('reports').delete().eq('question_id', id)

  return NextResponse.json({ ok: true })
}
