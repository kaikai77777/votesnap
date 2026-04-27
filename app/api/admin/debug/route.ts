import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'jchenkai29@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const reportsResult = await admin.from('reports').select('*').limit(10)
  const questionsResult = await admin.from('questions').select('id, question_text, status').limit(3)

  return NextResponse.json({
    user_email: user.email,
    reports: {
      data: reportsResult.data,
      error: reportsResult.error,
      count: reportsResult.data?.length ?? 0,
    },
    questions_sample: {
      data: questionsResult.data,
      error: questionsResult.error,
    },
    env_check: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  })
}
