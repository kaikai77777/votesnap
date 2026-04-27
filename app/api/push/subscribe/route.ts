import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await req.json()
  await supabase
    .from('profiles')
    .update({ push_subscription: subscription, notify_votes: true, notify_expiry: true })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
