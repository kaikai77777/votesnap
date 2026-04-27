export interface Profile {
  id: string
  display_name: string | null
  age_range: string | null
  gender: string | null
  interests: string[] | null
  is_pro: boolean
  created_at: string
}

export interface Question {
  id: string
  user_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c?: string | null
  option_d?: string | null
  category: string | null
  duration_minutes: number
  status: string
  expires_at: string
  created_at: string
  image_urls: string[] | null
  deleted_reason?: string | null
}

export interface Vote {
  id: string
  question_id: string
  user_id: string
  vote: string
  created_at: string
}

export interface Reaction {
  id: string
  question_id: string
  user_id: string | null
  anonymous_id: string | null
  emoji: string
  created_at: string
}

export interface QuestionWithVotes extends Question {
  votes_a: number
  votes_b: number
  total_votes: number
}

export const CATEGORIES = [
  '愛情', '職場', '購物', '生活', '旅遊', '美食',
  '健康', '科技', '運動', '其他',
] as const

export const CATEGORY_EN: Record<string, string> = {
  '愛情': 'Love', '職場': 'Work', '購物': 'Shopping', '生活': 'Life',
  '旅遊': 'Travel', '美食': 'Food', '健康': 'Health', '科技': 'Tech',
  '運動': 'Sports', '其他': 'Other',
}

export const AGE_RANGES = ['< 18', '18-24', '25-30', '31-40', '41+'] as const

export const GENDERS = ['男', '女', '非二元', '不透露'] as const

export const INTERESTS = [
  '時尚', '美妝', '美食', '旅遊', '音樂', '運動',
  '科技', '金融', '愛情', '職涯', '健康', '遊戲',
] as const
