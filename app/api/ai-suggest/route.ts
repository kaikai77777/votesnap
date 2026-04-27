import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { description, lang } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'Missing description' }, { status: 400 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const isZh = lang !== 'en'
  const prompt = isZh
    ? `用戶描述他的情境：「${description.trim()}」
請幫他生成 3 個適合在 VoteSnap 使用的二選一投票問題，每個問題也給出兩個選項。
格式（JSON array，不要其他文字）：
[
  { "question": "問題1", "optionA": "選A", "optionB": "選B" },
  { "question": "問題2", "optionA": "選A", "optionB": "選B" },
  { "question": "問題3", "optionA": "選A", "optionB": "選B" }
]
要有趣、口語化、能引發討論。`
    : `User's situation: "${description.trim()}"
Generate 3 fun, conversational binary-choice poll questions for VoteSnap. Include two options each.
Return only JSON array (no other text):
[
  { "question": "...", "optionA": "...", "optionB": "..." },
  { "question": "...", "optionA": "...", "optionB": "..." },
  { "question": "...", "optionA": "...", "optionB": "..." }
]`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  try {
    const suggestions = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
