import { createClient } from './supabase/client'
import type { Question, Profile } from '@/types'

export async function getActiveQuestionsForVoting(userId: string) {
  const supabase = createClient()

  const { data: voted } = await supabase
    .from('votes')
    .select('question_id')
    .eq('user_id', userId)

  const votedIds = voted?.map((v) => v.question_id) ?? []

  let query = supabase
    .from('questions')
    .select('*')
    .eq('status', 'active')
    .neq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(20)

  if (votedIds.length > 0) {
    query = query.not('id', 'in', `(${votedIds.join(',')})`)
  }

  return query
}

export async function createQuestion(payload: {
  user_id: string
  question_text: string
  option_a: string
  option_b: string
  category: string
  duration_minutes: number
}) {
  const supabase = createClient()
  const expires_at = new Date(
    Date.now() + payload.duration_minutes * 60 * 1000
  ).toISOString()

  return supabase
    .from('questions')
    .insert({ ...payload, status: 'active', expires_at })
    .select()
    .single()
}

export async function castVote(questionId: string, userId: string, vote: 'A' | 'B') {
  const supabase = createClient()
  return supabase
    .from('votes')
    .insert({ question_id: questionId, user_id: userId, vote })
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

export async function getUserQuestions(userId: string) {
  const supabase = createClient()
  return supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
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

export function calcVoteStats(votes: { vote: string }[]) {
  const total = votes.length
  const a = votes.filter((v) => v.vote === 'A').length
  const b = total - a
  const pctA = total > 0 ? Math.round((a / total) * 100) : 0
  const pctB = total > 0 ? 100 - pctA : 0
  return { total, a, b, pctA, pctB }
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
