'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function AboutPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  const faqs = isEn ? [
    {
      q: 'What is VoteSnap?',
      a: 'VoteSnap is a social poll platform for quick decisions. Post a yes/no or A/B question, share the link, and get real-time votes from your friends or the community — all anonymous.',
    },
    {
      q: 'Is voting anonymous?',
      a: 'Yes, completely. Question owners can only see vote percentages and total counts. No one can see who voted for which option.',
    },
    {
      q: 'Do I need an account to vote?',
      a: 'No. You can vote anonymously without signing up. An account is only required to post questions.',
    },
    {
      q: 'How long does a poll last?',
      a: 'Free users can set polls from 30 minutes up to 24 hours. Pro users can choose any duration from 5 minutes to 7 days.',
    },
    {
      q: 'What is VoteSnap Pro?',
      a: 'Pro is a one-time $4 lifetime upgrade that unlocks: unlimited daily questions, custom poll durations (5 min – 7 days), demographic breakdowns (age & gender), and priority feed exposure.',
    },
    {
      q: 'Can I get a refund?',
      a: 'Yes. We offer a 14-day no-questions-asked refund from the date of purchase. Email votesnap.online@gmail.com with your order ID.',
    },
    {
      q: 'How do I report inappropriate content?',
      a: 'Tap the flag icon on any poll card to report it. Our team reviews all reports and removes content that violates our Community Rules.',
    },
    {
      q: 'How do I contact you?',
      a: 'Email us at votesnap.online@gmail.com. We typically respond within 1–2 business days.',
    },
  ] : [
    {
      q: 'VoteSnap 是什麼？',
      a: 'VoteSnap 是一個快速決策的社群投票平台。發布一個是非題或 A/B 選擇題，分享連結，即可獲得朋友或社群的即時匿名投票。',
    },
    {
      q: '投票是匿名的嗎？',
      a: '是的，完全匿名。問題發布者只能看到投票百分比和總票數，任何人都無法得知誰投了哪個選項。',
    },
    {
      q: '投票需要帳號嗎？',
      a: '不需要。您可以在不註冊的情況下匿名投票。只有發布問題才需要帳號。',
    },
    {
      q: '投票持續多長時間？',
      a: '免費用戶可設定 30 分鐘到 24 小時。Pro 用戶可選擇從 5 分鐘到 7 天的任意時長。',
    },
    {
      q: 'VoteSnap Pro 是什麼？',
      a: 'Pro 是一次性 $4 永久升級，解鎖：無限每日發問、自訂投票時效（5 分鐘 ～ 7 天）、人口統計分析（年齡與性別）、以及優先曝光排序。',
    },
    {
      q: '可以退款嗎？',
      a: '可以。我們提供購買日起 14 天無條件退款。請寄信至 votesnap.online@gmail.com 並附上訂單編號。',
    },
    {
      q: '如何檢舉不當內容？',
      a: '點擊任何投票卡片上的旗幟圖示即可檢舉。我們的團隊會審核所有檢舉，並下架違反社群規範的內容。',
    },
    {
      q: '如何聯絡你們？',
      a: '請寄信至 votesnap.online@gmail.com，我們通常在 1–2 個工作日內回覆。',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-lg mx-auto">

        {/* About */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-black gradient-text">votesnap</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            {isEn
              ? 'VoteSnap is built for the moments when you just can\'t decide. Post a question, share the link, and let real people vote — anonymously, in real time.'
              : 'VoteSnap 是為那些拿不定主意的時刻而生。發一個問題、分享連結，讓真實的人即時匿名投票。'}
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isEn
              ? 'Launched in 2025. Built with Next.js, Supabase, and a lot of indecision.'
              : '2025 年上線。用 Next.js、Supabase，以及大量選擇困難打造而成。'}
          </p>
        </div>

        {/* Contact */}
        <div className="card p-5 mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">{isEn ? 'Contact' : '聯絡我們'}</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">✉</span>
              <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline">
                votesnap.online@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">🌐</span>
              <span>votesnap.online</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-lg font-bold text-white mb-4">
          {isEn ? 'Frequently Asked Questions' : '常見問題'}
        </h2>
        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <div key={q} className="card p-5">
              <p className="text-white text-sm font-medium mb-2">{q}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400">{isEn ? 'Terms' : '服務條款'}</Link>
          <Link href="/privacy" className="hover:text-gray-400">{isEn ? 'Privacy' : '隱私政策'}</Link>
          <Link href="/refund" className="hover:text-gray-400">{isEn ? 'Refund' : '退款政策'}</Link>
          <Link href="/rules" className="hover:text-gray-400">{isEn ? 'Rules' : '社群規範'}</Link>
        </div>
      </main>
    </div>
  )
}
