import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

const MILESTONES = [5, 10, 50, 100]

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(req: NextRequest) {
  const { questionId } = await req.json()
  if (!questionId) return NextResponse.json({ ok: false })

  const supabase = createAdminClient()

  const [{ data: question }, { count }] = await Promise.all([
    supabase.from('questions').select('id, user_id, question_text').eq('id', questionId).single(),
    supabase.from('votes').select('*', { count: 'exact', head: true }).eq('question_id', questionId),
  ])

  if (!question || !count || !MILESTONES.includes(count)) return NextResponse.json({ ok: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('push_subscription, notify_votes')
    .eq('id', question.user_id)
    .single()

  if (!profile?.push_subscription || !profile.notify_votes) return NextResponse.json({ ok: false })

  try {
    await webpush.sendNotification(
      profile.push_subscription as webpush.PushSubscription,
      JSON.stringify({
        title: `🗳️ 你的問題獲得第 ${count} 票！`,
        body: question.question_text,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/result/${questionId}`,
      })
    )
  } catch {
    // subscription may have expired, ignore
  }

  return NextResponse.json({ ok: true })
}
