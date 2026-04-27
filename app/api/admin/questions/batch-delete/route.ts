import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

const REASON_LABELS: Record<string, string> = {
  spam: '垃圾訊息',
  inappropriate: '不當內容',
  hate: '仇恨言論',
  harassment: '騷擾霸凌',
  misinformation: '散佈錯誤資訊',
  other: '違反使用規範',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { ids, reason } = body as { ids: string[]; reason: string }
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
  }

  const admin = createAdminClient()
  const reasonLabel = REASON_LABELS[reason] ?? reason ?? '違反使用規範'

  // Delete reports for all questions
  await admin.from('reports').delete().in('question_id', ids)

  // Soft-delete all
  const { error: delErr } = await admin
    .from('questions')
    .update({ status: 'deleted' })
    .in('id', ids)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Store reason (best-effort)
  await admin.from('questions')
    .update({ deleted_reason: reasonLabel } as Record<string, string>)
    .in('id', ids)

  return NextResponse.json({ ok: true, count: ids.length })
}
