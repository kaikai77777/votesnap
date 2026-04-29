import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const anonymousId = searchParams.get('anon') ?? undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const admin = createAdminClient()

  // Get voted question IDs (admin bypasses RLS)
  let votedIds: string[] = []
  if (userId) {
    const { data } = await admin.from('votes').select('question_id').eq('user_id', userId)
    votedIds = data?.map(v => v.question_id) ?? []
  } else if (anonymousId) {
    const { data } = await admin.from('votes').select('question_id').eq('anonymous_id', anonymousId)
    votedIds = data?.map(v => v.question_id) ?? []
  }

  // Build questions query
  let query = admin
    .from('questions')
    .select('*')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(20)

  // Filter out user's own questions — but if the user IS the bot account,
  // skip this filter so bot-posted questions remain visible to everyone
  const botUserId = process.env.BOT_USER_ID
  if (userId && userId !== botUserId) {
    query = query.neq('user_id', userId)
  }
  if (votedIds.length > 0) query = query.not('id', 'in', `(${votedIds.join(',')})`)

  const { data: activeQs, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fill with ended hot questions if < 10
  let result = activeQs ?? []
  if (result.length < 10) {
    const need = 10 - result.length
    const excludeIds = [...votedIds, ...result.map(q => q.id)]
    let endedQuery = admin
      .from('questions').select('*').eq('status', 'ended')
      .order('created_at', { ascending: false }).limit(50)
    if (excludeIds.length > 0) endedQuery = endedQuery.not('id', 'in', `(${excludeIds.join(',')})`)
    const { data: endedQs } = await endedQuery

    if (endedQs && endedQs.length > 0) {
      const { data: voteCounts } = await admin
        .from('votes').select('question_id').in('question_id', endedQs.map(q => q.id))
      const countMap: Record<string, number> = {}
      for (const v of voteCounts ?? []) countMap[v.question_id] = (countMap[v.question_id] ?? 0) + 1
      const hot = endedQs.filter(q => (countMap[q.id] ?? 0) >= 50).slice(0, need)
      const fill = hot.length < need ? endedQs.filter(q => !hot.find(h => h.id === q.id)).slice(0, need - hot.length) : []
      result = [...result, ...hot, ...fill]
    }
  }

  return NextResponse.json(result)
}
