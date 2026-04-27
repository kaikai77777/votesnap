'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

type Tab = 'about' | 'terms' | 'privacy' | 'refund'

export default function LegalPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'
  const [tab, setTab] = useState<Tab>('about')

  const TABS: { key: Tab; label: string }[] = isEn
    ? [
        { key: 'about',   label: 'About & FAQ' },
        { key: 'terms',   label: 'Terms' },
        { key: 'privacy', label: 'Privacy' },
        { key: 'refund',  label: 'Refund' },
      ]
    : [
        { key: 'about',   label: '關於 & FAQ' },
        { key: 'terms',   label: '服務條款' },
        { key: 'privacy', label: '隱私政策' },
        { key: 'refund',  label: '退款政策' },
      ]

  const updated = isEn ? 'January 1, 2025' : '2025 年 1 月 1 日'

  // ── ABOUT / FAQ ────────────────────────────────────────────────────────────
  const faqs = isEn ? [
    { q: 'What is VoteSnap?', a: 'VoteSnap is a social poll platform for quick decisions. Post a yes/no or A/B question, share the link, and get real-time votes from your friends or the community — all anonymous.' },
    { q: 'Is voting anonymous?', a: 'Yes, completely. Question owners can only see vote percentages and total counts. No one can see who voted for which option.' },
    { q: 'Do I need an account to vote?', a: 'No. You can vote anonymously without signing up. An account is only required to post questions.' },
    { q: 'How long does a poll last?', a: 'Free users can set polls from 30 minutes up to 24 hours. Pro users can choose any duration from 5 minutes to 7 days.' },
    { q: 'What is VoteSnap Pro?', a: 'Pro is a one-time $4 lifetime upgrade that unlocks unlimited daily questions, custom durations (5 min – 7 days), demographic breakdowns, and priority feed exposure.' },
    { q: 'Can I get a refund?', a: 'Yes. We offer a 14-day no-questions-asked refund. Email votesnap.online@gmail.com with your order ID.' },
    { q: 'How do I report inappropriate content?', a: 'Tap the flag icon on any poll card to report it. Our team reviews all reports and removes violating content.' },
    { q: 'How do I contact you?', a: 'Email votesnap.online@gmail.com. We typically respond within 1–2 business days.' },
  ] : [
    { q: 'VoteSnap 是什麼？', a: 'VoteSnap 是一個快速決策的社群投票平台。發布一個是非題或 A/B 選擇題，分享連結，即可獲得朋友或社群的即時匿名投票。' },
    { q: '投票是匿名的嗎？', a: '是的，完全匿名。問題發布者只能看到投票百分比和總票數，任何人都無法得知誰投了哪個選項。' },
    { q: '投票需要帳號嗎？', a: '不需要。您可以在不註冊的情況下匿名投票。只有發布問題才需要帳號。' },
    { q: '投票持續多長時間？', a: '免費用戶可設定 30 分鐘到 24 小時。Pro 用戶可選擇從 5 分鐘到 7 天的任意時長。' },
    { q: 'VoteSnap Pro 是什麼？', a: 'Pro 是一次性 $4 永久升級，解鎖無限每日發問、自訂投票時效（5 分鐘 ～ 7 天）、人口統計分析、以及優先曝光排序。' },
    { q: '可以退款嗎？', a: '可以。購買日起 14 天無條件退款。請寄信至 votesnap.online@gmail.com 並附上訂單編號。' },
    { q: '如何檢舉不當內容？', a: '點擊任何投票卡片上的旗幟圖示即可檢舉。我們的團隊會審核所有檢舉，並下架違規內容。' },
    { q: '如何聯絡你們？', a: '請寄信至 votesnap.online@gmail.com，我們通常在 1–2 個工作日內回覆。' },
  ]

  // ── TERMS ──────────────────────────────────────────────────────────────────
  const terms = isEn ? [
    { t: '1. Acceptance of Terms', b: 'By accessing or using VoteSnap, you agree to be bound by these Terms of Service.' },
    { t: '2. Description of Service', b: 'VoteSnap is a social decision-making platform for posting binary-choice polls and collecting anonymous votes.' },
    { t: '3. User Accounts', b: 'To post questions, you must register with a valid email. You are responsible for all activities under your account.' },
    { t: '4. User Content', b: 'You retain ownership of your content. By posting, you grant us a license to display it within the Service. You are responsible for ensuring content complies with our Community Rules.' },
    { t: '5. Prohibited Conduct', b: 'No hate speech, harassment, spam, adult content, or anything that violates applicable law. We may remove content and suspend accounts without notice.' },
    { t: '6. Pro Membership', b: 'VoteSnap Pro is a one-time purchase granting lifetime access to Pro features, subject to our Refund Policy. Features are non-transferable.' },
    { t: '7. Disclaimer', b: 'The Service is provided "as is." We do not guarantee uninterrupted service or that poll results are statistically representative.' },
    { t: '8. Limitation of Liability', b: 'VoteSnap shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service.' },
    { t: '9. Changes', b: 'We may update these Terms at any time. Continued use constitutes acceptance. Material changes will be communicated via email or in-app notice.' },
    { t: '10. Contact', b: 'votesnap.online@gmail.com' },
  ] : [
    { t: '1. 條款接受', b: '使用 VoteSnap 即表示您同意受本服務條款約束。' },
    { t: '2. 服務說明', b: 'VoteSnap 是一個供用戶發布二選一投票問題並收集社群匿名投票的平台。' },
    { t: '3. 用戶帳號', b: '發布問題需以有效電子郵件建立帳號。您須對帳號下的所有活動負責。' },
    { t: '4. 用戶內容', b: '您保留所提交內容的所有權，並授予我們在本服務內展示的授權。您須確保內容符合社群規範。' },
    { t: '5. 禁止行為', b: '禁止仇恨言論、騷擾、垃圾訊息、成人內容或違法內容。違規內容得不予通知即下架並暫停帳號。' },
    { t: '6. Pro 會員', b: 'VoteSnap Pro 為一次性購買，享有終身 Pro 功能，適用退款政策，功能與帳號綁定不可轉讓。' },
    { t: '7. 免責聲明', b: '本服務「按現狀」提供，不保證服務不中斷，亦不保證投票結果具有統計代表性。' },
    { t: '8. 責任限制', b: '在法律允許範圍內，VoteSnap 對因使用本服務產生的間接或結果性損害不承擔責任。' },
    { t: '9. 條款變更', b: '我們可能隨時更新本條款，繼續使用即表示接受。重大變更將透過電子郵件或應用程式通知。' },
    { t: '10. 聯絡方式', b: 'votesnap.online@gmail.com' },
  ]

  // ── PRIVACY ────────────────────────────────────────────────────────────────
  const privacy = isEn ? [
    { t: '1. Information We Collect', b: 'Email, display name, poll content, usage data, device info, and anonymous session IDs. Payments processed by Stripe — we never see card details.' },
    { t: '2. How We Use It', b: 'To provide the Service, prevent abuse, send transactional emails, analyze usage, and process Pro purchases.' },
    { t: '3. Anonymity of Votes', b: 'Votes are anonymous. Owners see only percentages. Anonymous votes link only to a local session ID on your device.' },
    { t: '4. Third Parties', b: 'Supabase (database & auth), Stripe (payments), Netlify (hosting), Anthropic (AI suggestions). Each has its own privacy policy.' },
    { t: '5. Cookies & Storage', b: 'We use cookies for auth sessions and local storage for anonymous vote tracking. No third-party ad cookies.' },
    { t: '6. Data Retention', b: 'Questions and results are stored indefinitely. Account data retained until deletion is requested.' },
    { t: '7. Your Rights', b: 'You may access, correct, or delete your data at any time. Email votesnap.online@gmail.com. We respond within 30 days.' },
    { t: '8. Security', b: 'All data transmitted over HTTPS. Row-Level Security enforced via Supabase. Passwords never stored.' },
    { t: '9. Children', b: 'Not directed at children under 13. Contact us immediately if you believe a child has submitted personal data.' },
    { t: '10. Contact', b: 'votesnap.online@gmail.com' },
  ] : [
    { t: '1. 收集的資訊', b: '電子郵件、顯示名稱、投票內容、使用資料、裝置資訊及匿名工作階段 ID。付款由 Stripe 安全處理，我們從不查看卡片資訊。' },
    { t: '2. 用途', b: '提供服務、防止濫用、發送交易性電子郵件、分析使用模式、處理 Pro 購買。' },
    { t: '3. 投票匿名性', b: '投票完全匿名，發問者只能看到百分比。匿名投票僅與裝置本機的工作階段 ID 連結。' },
    { t: '4. 第三方', b: 'Supabase（資料庫與驗證）、Stripe（付款）、Netlify（主機）、Anthropic（AI 建議）。各服務均有其隱私政策。' },
    { t: '5. Cookie 與儲存', b: '使用 Cookie 進行身份驗證，本機儲存用於匿名投票追蹤。不使用第三方廣告 Cookie。' },
    { t: '6. 資料保留', b: '問題與結果無限期保存。帳號資料保留至申請刪除為止。' },
    { t: '7. 您的權利', b: '您可隨時存取、更正或刪除個人資料。請寄信至 votesnap.online@gmail.com，我們將於 30 天內回覆。' },
    { t: '8. 安全性', b: '所有資料透過 HTTPS 傳輸，Supabase 資料列層級安全性保護。密碼從不儲存。' },
    { t: '9. 兒童', b: '不針對 13 歲以下兒童。如認為兒童已提交個人資訊，請立即聯絡我們。' },
    { t: '10. 聯絡方式', b: 'votesnap.online@gmail.com' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            {isEn ? 'About & Legal' : '關於 & 法律文件'}
          </h1>
          <p className="text-gray-500 text-sm">{isEn ? `Last updated: ${updated}` : `最後更新：${updated}`}</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6 overflow-x-auto">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === key ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── About / FAQ ── */}
        {tab === 'about' && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-black gradient-text">votesnap</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-2">
                {isEn
                  ? "VoteSnap is built for the moments when you just can't decide. Post a question, share the link, and let real people vote — anonymously, in real time."
                  : 'VoteSnap 是為那些拿不定主意的時刻而生。發一個問題、分享連結，讓真實的人即時匿名投票。'}
              </p>
              <p className="text-sm text-gray-500">
                {isEn ? 'Launched 2025 · ' : '2025 年上線 · '}
                <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline">votesnap.online@gmail.com</a>
              </p>
            </div>
            {faqs.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <p className="text-white text-sm font-medium mb-1.5">{q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Terms ── */}
        {tab === 'terms' && (
          <div className="space-y-4">
            {terms.map(({ t: title, b: body }) => (
              <div key={title} className="card p-5">
                <p className="text-white text-sm font-semibold mb-1.5">{title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Privacy ── */}
        {tab === 'privacy' && (
          <div className="space-y-4">
            {privacy.map(({ t: title, b: body }) => (
              <div key={title} className="card p-5">
                <p className="text-white text-sm font-semibold mb-1.5">{title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Refund ── */}
        {tab === 'refund' && (
          <div className="space-y-4">
            <div className="card p-6">
              <p className="text-white text-sm font-semibold mb-2">{isEn ? 'One-Time Purchase' : '一次性購買'}</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                {isEn
                  ? 'VoteSnap Pro is a one-time purchase digital product. We offer a 14-day money-back guarantee from the date of purchase, no questions asked. To request a refund, contact votesnap.online@gmail.com with your order ID. Refunds are processed within 5–7 business days back to the original payment method.'
                  : 'VoteSnap Pro 為一次性購買之數位商品。我們提供購買日起 14 天無條件退款。如需退款，請寄信至 votesnap.online@gmail.com 並附上訂單編號。退款將於 5–7 個工作日內退回原付款方式。'}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-white text-sm font-semibold mb-2">{isEn ? 'After 14 Days' : '14 天後'}</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                {isEn
                  ? 'After 14 days, all sales are final. Pro features remain active for the lifetime of your account.'
                  : '14 天後不再受理退款，Pro 功能將於您的帳號內永久有效。'}
              </p>
            </div>
            <div className="card p-6">
              <p className="text-white text-sm font-semibold mb-3">{isEn ? 'How to Request' : '如何申請'}</p>
              <ol className="space-y-2 text-sm text-gray-400">
                {(isEn
                  ? ['Email votesnap.online@gmail.com within 14 days of purchase', 'Include your order ID (from Stripe confirmation email)', 'Refund processed within 5–7 business days']
                  : ['購買後 14 天內寄信至 votesnap.online@gmail.com', '附上訂單編號（可在 Stripe 確認信中找到）', '我們將於 5–7 個工作日內處理退款']
                ).map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-[11px] text-gray-500 shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
              <p className="text-white text-sm font-semibold mb-2">✦ {isEn ? 'Summary' : '摘要'}</p>
              <div className="space-y-1.5 text-sm text-gray-400">
                {(isEn
                  ? ['14-day no-questions-asked refund', 'Refunded to original payment method', 'Pro access active for lifetime of account', 'No refunds after 14 days']
                  : ['14 天無條件退款', '退回原付款方式', 'Pro 功能帳號永久有效', '14 天後不受理退款']
                ).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={i < 3 ? 'text-green-400' : 'text-gray-600'}>{i < 3 ? '✓' : '·'}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 rounded-2xl border border-white/6 text-center">
          <p className="text-gray-500 text-sm">
            {isEn ? 'Questions? ' : '有問題？'}
            <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline">
              votesnap.online@gmail.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
