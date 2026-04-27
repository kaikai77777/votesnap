'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function PrivacyPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  const updated = 'January 1, 2025'
  const updatedZh = '2025 年 1 月 1 日'

  const sections = isEn ? [
    {
      title: '1. Information We Collect',
      body: 'We collect the following information when you use VoteSnap:\n• Account info: email address and display name (when you sign up)\n• Content: poll questions and options you create\n• Usage data: votes cast, questions viewed, and interactions with the platform\n• Device info: browser type, language preference, and anonymous session identifiers\n• Payment info: processed securely by Stripe — we never see or store your card details',
    },
    {
      title: '2. How We Use Your Information',
      body: 'We use your information to:\n• Provide and improve the Service\n• Prevent spam, abuse, and policy violations\n• Send transactional emails (e.g., account verification)\n• Analyze aggregate usage patterns to improve features\n• Process payments and verify Pro membership status',
    },
    {
      title: '3. Anonymity of Votes',
      body: 'All votes are anonymous. Question owners can only see vote percentages and aggregate counts — they cannot see who voted for which option. Anonymous votes are linked only to a randomly generated session ID stored locally on your device.',
    },
    {
      title: '4. Third-Party Services',
      body: 'We use the following third-party services:\n• Supabase — database and authentication\n• Stripe — payment processing\n• Netlify — hosting and deployment\n• Anthropic Claude API — AI-generated suggestions\n\nEach service has its own privacy policy and security standards.',
    },
    {
      title: '5. Cookies & Local Storage',
      body: 'We use cookies for authentication sessions and local storage for anonymous vote tracking and language preferences. We do not use third-party advertising cookies or tracking pixels.',
    },
    {
      title: '6. Data Retention',
      body: 'Poll questions and results are stored indefinitely so creators can review them at any time. You may delete your questions at any time from My Questions. Account data is retained until you request deletion.',
    },
    {
      title: '7. Your Rights',
      body: 'You have the right to access, correct, or delete your personal data at any time. To request account deletion or a data export, contact us at votesnap.online@gmail.com. We will respond within 30 days.',
    },
    {
      title: '8. Data Security',
      body: 'All data is transmitted over HTTPS. We use Supabase Row-Level Security to ensure users can only access their own data. Passwords are never stored — we use Supabase Auth with secure token-based sessions.',
    },
    {
      title: '9. Children\'s Privacy',
      body: 'VoteSnap is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.',
    },
    {
      title: '10. Changes to This Policy',
      body: 'We may update this Privacy Policy from time to time. We will notify users of significant changes via email or in-app notice. Continued use of the Service after changes constitutes acceptance.',
    },
    {
      title: '11. Contact',
      body: 'For privacy-related questions or data requests, contact: votesnap.online@gmail.com',
    },
  ] : [
    {
      title: '1. 我們收集的資訊',
      body: '當您使用 VoteSnap 時，我們收集以下資訊：\n• 帳號資訊：電子郵件與顯示名稱（註冊時）\n• 內容：您建立的投票問題與選項\n• 使用資料：投票紀錄、瀏覽的問題及平台互動\n• 裝置資訊：瀏覽器類型、語言偏好及匿名工作階段識別碼\n• 付款資訊：由 Stripe 安全處理——我們從不查看或儲存您的卡片資訊',
    },
    {
      title: '2. 我們如何使用您的資訊',
      body: '我們使用您的資訊以：\n• 提供並改善本服務\n• 防止垃圾訊息、濫用及違規行為\n• 發送交易性電子郵件（如帳號驗證）\n• 分析匯總使用模式以改善功能\n• 處理付款並驗證 Pro 會員資格',
    },
    {
      title: '3. 投票匿名性',
      body: '所有投票均為匿名。問題發布者只能看到投票百分比和總票數——無法得知誰投了哪個選項。匿名投票僅與儲存在您裝置上的隨機工作階段 ID 連結。',
    },
    {
      title: '4. 第三方服務',
      body: '我們使用以下第三方服務：\n• Supabase — 資料庫與身份驗證\n• Stripe — 付款處理\n• Netlify — 主機與部署\n• Anthropic Claude API — AI 建議功能\n\n各服務均有其隱私政策與安全標準。',
    },
    {
      title: '5. Cookie 與本機儲存',
      body: '我們使用 Cookie 進行身份驗證，並使用本機儲存追蹤匿名投票紀錄與語言偏好。我們不使用第三方廣告 Cookie 或追蹤像素。',
    },
    {
      title: '6. 資料保留',
      body: '投票問題與結果會無限期保存，讓發問者隨時可查閱。您可以隨時在「我的問題」中刪除問題。帳號資料保留至您要求刪除為止。',
    },
    {
      title: '7. 您的權利',
      body: '您有權隨時存取、更正或刪除您的個人資料。如需刪除帳號或匯出資料，請聯絡 votesnap.online@gmail.com，我們將於 30 天內回覆。',
    },
    {
      title: '8. 資料安全',
      body: '所有資料均透過 HTTPS 傳輸。我們使用 Supabase 資料列層級安全性確保用戶只能存取自己的資料。密碼從不儲存——我們使用 Supabase Auth 的安全令牌工作階段。',
    },
    {
      title: '9. 兒童隱私',
      body: 'VoteSnap 不針對 13 歲以下兒童。我們不會在知情情況下收集兒童的個人資訊。如您認為兒童已向我們提供個人資訊，請立即聯絡我們。',
    },
    {
      title: '10. 政策變更',
      body: '我們可能不時更新本隱私政策。重大變更將透過電子郵件或應用程式內通知告知用戶。繼續使用本服務即表示接受變更。',
    },
    {
      title: '11. 聯絡方式',
      body: '如有隱私相關疑問或資料請求，請聯絡：votesnap.online@gmail.com',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isEn ? 'Privacy Policy' : '隱私政策'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEn ? `Last updated: ${updated}` : `最後更新：${updatedZh}`}
          </p>
        </div>

        <div className="space-y-6">
          {sections.map(({ title, body }) => (
            <div key={title} className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-2xl border border-white/6 text-center">
          <p className="text-gray-500 text-sm">
            {isEn ? 'Privacy questions? ' : '隱私疑問？'}
            <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline">
              votesnap.online@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400">{isEn ? 'Terms of Service' : '服務條款'}</Link>
          <Link href="/refund" className="hover:text-gray-400">{isEn ? 'Refund Policy' : '退款政策'}</Link>
          <Link href="/rules" className="hover:text-gray-400">{isEn ? 'Community Rules' : '社群規範'}</Link>
        </div>
      </main>
    </div>
  )
}
