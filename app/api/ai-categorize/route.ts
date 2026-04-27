import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const CATEGORIES = ['愛情', '職場', '購物', '生活', '旅遊', '美食', '健康', '科技', '運動', '其他']

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { question } = await req.json()
  if (!question?.trim()) return NextResponse.json({ category: null })

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `以下投票問題屬於哪個分類？只回傳分類名稱，不要其他文字。
分類選項：${CATEGORIES.join('、')}
問題：${question}`,
      }],
    })
    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const category = CATEGORIES.find(c => raw.includes(c)) ?? '其他'
    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ category: null })
  }
}
