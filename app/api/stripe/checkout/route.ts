import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const origin = req.headers.get('origin') ?? 'https://votesnap.online'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'VoteSnap Pro',
            description: '無限發問、自訂投票時效（5 分鐘 ～ 7 天）、人口分析數據',
          },
          unit_amount: 400, // $4.00
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${origin}/pricing?success=true`,
    cancel_url: `${origin}/pricing?cancelled=true`,
    metadata: { user_id: user.id },
    customer_email: user.email ?? undefined,
  })

  return NextResponse.json({ url: session.url })
}
