import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

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
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, reason } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch question to get creator's user_id
  const { data: question } = await admin
    .from('questions')
    .select('user_id, question_text')
    .eq('id', id)
    .single()

  const reasonLabel = REASON_LABELS[reason] ?? reason ?? '違反使用規範'

  // Delete reports first
  await admin.from('reports').delete().eq('question_id', id)

  // Soft-delete: status update is always safe
  const { error: delErr } = await admin.from('questions').update({ status: 'deleted' }).eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Store reason separately — fails silently if column doesn't exist yet
  await admin.from('questions').update({ deleted_reason: reasonLabel } as Record<string, string>).eq('id', id)

  // Notify creator via push if they have a subscription
  if (question?.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('push_subscription')
      .eq('id', question.user_id)
      .single()

    if (profile?.push_subscription) {
      try {
        await webpush.sendNotification(
          profile.push_subscription as webpush.PushSubscription,
          JSON.stringify({
            title: '你的投票已被移除',
            body: `「${question.question_text.slice(0, 30)}」因${reasonLabel}遭管理員移除。`,
            url: '/',
          })
        )
      } catch {
        // push failure is non-fatal
      }
    }
  }

  return NextResponse.json({ ok: true })
}
