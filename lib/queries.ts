import { createClient } from './supabase/client'
import type { Profile } from '@/types'

export async function getActiveQuestionsForVoting(userId?: string | null, anonymousId?: string | null) {
  const supabase = createClient()

  let votedIds: string[] = []
  if (userId) {
    const { data } = await supabase.from('votes').select('question_id').eq('user_id', userId)
    votedIds = data?.map(v => v.question_id) ?? []
  } else if (anonymousId) {
    const { data } = await supabase.from('votes').select('question_id').eq('anonymous_id', anonymousId)
    votedIds = data?.map(v => v.question_id) ?? []
  }

  let query = supabase
    .from('questions')
    .select('*')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('is_priority', { ascending: false })
    .order('expires_at', { ascending: true })
    .limit(20)

  if (userId) query = query.neq('user_id', userId)
  if (votedIds.length > 0) query = query.not('id', 'in', `(${votedIds.join(',')})`)

  const { data: activeQs, error } = await query

  // Phase 0.4: 不足 10 題時補熱門已結束題目
  if (!error && activeQs && activeQs.length < 10) {
    const excludeIds = [...votedIds, ...activeQs.map(q => q.id)]
    let endedQuery = supabase
      .from('questions').select('*').eq('status', 'ended')
      .order('created_at', { ascending: false }).limit(10 - activeQs.length)
    if (excludeIds.length > 0) endedQuery = endedQuery.not('id', 'in', `(${excludeIds.join(',')})`)
    const { data: endedQs } = await endedQuery
    return { data: [...(activeQs ?? []), ...(endedQs ?? [])], error: null }
  }

  return { data: activeQs ?? [], error }
}

export async function createQuestion(payload: {
  user_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c?: string
  option_d?: string
  category: string
  duration_minutes: number
  is_priority?: boolean
}) {
  const supabase = createClient()
  const expires_at = new Date(
    Date.now() + payload.duration_minutes * 60 * 1000
  ).toISOString()

  return supabase
    .from('questions')
    .insert({ ...payload, status: 'active', expires_at, image_urls: [] })
    .select()
    .single()
}

export async function uploadQuestionImages(files: File[], questionId: string): Promise<string[]> {
  const supabase = createClient()
  const urls: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${questionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      console.error('[upload] storage error:', uploadError)
    } else {
      const { data } = supabase.storage.from('question-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
  }

  if (urls.length > 0) {
    const { error: updateError } = await supabase
      .from('questions')
      .update({ image_urls: urls })
      .eq('id', questionId)
    if (updateError) console.error('[upload] update error:', updateError)
  }

  return urls
}

export async function castVote(
  questionId: string,
  vote: 'A' | 'B',
  userId?: string | null,
  anonymousId?: string | null
) {
  const supabase = createClient()
  return supabase
    .from('votes')
    .insert({ question_id: questionId, user_id: userId ?? null, anonymous_id: anonymousId ?? null, vote })
    .select()
    .single()
}

export async function getQuestionById(id: string) {
  const supabase = createClient()
  return supabase.from('questions').select('*').eq('id', id).single()
}

export async function getVotesByQuestion(questionId: string) {
  const supabase = createClient()
  return supabase.from('votes').select('vote').eq('question_id', questionId)
}

export async function deleteQuestion(id: string) {
  const supabase = createClient()
  return supabase.from('questions').update({ status: 'deleted' }).eq('id', id)
}

export async function getUserQuestions(userId: string) {
  const supabase = createClient()
  return supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
}

export async function getProfile(userId: string) {
  const supabase = createClient()
  return supabase.from('profiles').select('*').eq('id', userId).single()
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  const supabase = createClient()
  return supabase.from('profiles').upsert(profile).select().single()
}

export async function getDemographicStats(questionId: string) {
  const supabase = createClient()
  const { data: votes } = await supabase
    .from('votes').select('vote, user_id').eq('question_id', questionId)
  if (!votes || votes.length === 0) return null

  const userIds = [...new Set(votes.map(v => v.user_id))]
  const { data: profiles } = await supabase
    .from('profiles').select('id, age_range, gender').in('id', userIds)

  type Bucket = { a: number; b: number }
  const age: Record<string, Bucket> = {}
  const gender: Record<string, Bucket> = {}

  for (const v of votes) {
    const p = profiles?.find(x => x.id === v.user_id)
    const ag = p?.age_range ?? '未知'
    const gd = p?.gender ?? '未知'
    if (!age[ag]) age[ag] = { a: 0, b: 0 }
    if (!gender[gd]) gender[gd] = { a: 0, b: 0 }
    if (v.vote === 'A') { age[ag].a++; gender[gd].a++ }
    else { age[ag].b++; gender[gd].b++ }
  }

  return { age, gender }
}

export function calcVoteStats(votes: { vote: string }[]) {
  const total = votes.length
  const a = votes.filter((v) => v.vote === 'A').length
  const b = votes.filter((v) => v.vote === 'B').length
  const c = votes.filter((v) => v.vote === 'C').length
  const d = votes.filter((v) => v.vote === 'D').length
  const safe = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0
  return { total, a, b, c, d, pctA: safe(a), pctB: safe(b), pctC: safe(c), pctD: safe(d) }
}

export async function getReactions(questionId: string) {
  const supabase = createClient()
  return supabase.from('reactions').select('emoji, user_id, anonymous_id').eq('question_id', questionId)
}

export async function addReaction(questionId: string, emoji: string, userId?: string | null, anonymousId?: string | null) {
  const supabase = createClient()
  return supabase.from('reactions')
    .insert({ question_id: questionId, user_id: userId ?? null, anonymous_id: anonymousId ?? null, emoji })
}

export async function removeReaction(questionId: string, emoji: string, userId?: string | null, anonymousId?: string | null) {
  const supabase = createClient()
  let q = supabase.from('reactions').delete().eq('question_id', questionId).eq('emoji', emoji)
  if (userId) return q.eq('user_id', userId)
  if (anonymousId) return q.eq('anonymous_id', anonymousId)
  return q
}

export function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date()
}

export function formatCountdown(expiresAt: string): string {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now())
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
