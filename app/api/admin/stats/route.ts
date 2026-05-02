import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const [
    { count: totalQuestions },
    { count: totalVotes },
    { count: totalUsers },
    { count: totalReports },
    { count: activeQuestions },
    { count: todayRegistrations },
    { count: onlineUsers },
  ] = await Promise.all([
    admin.from('questions').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
    admin.from('votes').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('reports').select('*', { count: 'exact', head: true }),
    admin.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', fiveMinAgo),
  ])

  return NextResponse.json({
    totalQuestions,
    totalVotes,
    totalUsers,
    totalReports,
    activeQuestions,
    todayRegistrations,
    onlineUsers,
  })
}
