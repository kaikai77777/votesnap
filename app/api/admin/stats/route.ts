import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const [
    { count: totalQuestions },
    { count: totalVotes },
    { count: totalUsers },
    { count: totalReports },
    { count: activeQuestions },
  ] = await Promise.all([
    admin.from('questions').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
    admin.from('votes').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('reports').select('*', { count: 'exact', head: true }),
    admin.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return NextResponse.json({ totalQuestions, totalVotes, totalUsers, totalReports, activeQuestions })
}
