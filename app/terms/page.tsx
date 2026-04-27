'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function TermsPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  const updated = 'January 1, 2025'
  const updatedZh = '2025 年 1 月 1 日'

  const sections = isEn ? [
    {
      title: '1. Acceptance of Terms',
      body: 'By accessing or using VoteSnap ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.',
    },
    {
      title: '2. Description of Service',
      body: 'VoteSnap is a social decision-making platform that allows users to post binary-choice poll questions and collect anonymous votes from the community. The Service is provided "as is" and may be updated or modified at any time.',
    },
    {
      title: '3. User Accounts',
      body: 'You may browse and vote anonymously. To post questions, you must create an account using a valid email address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
    },
    {
      title: '4. User Content',
      body: 'You retain ownership of the content you submit. By posting content on VoteSnap, you grant us a non-exclusive, worldwide, royalty-free license to display and distribute your content within the Service. You are solely responsible for ensuring your content complies with our Community Rules.',
    },
    {
      title: '5. Prohibited Conduct',
      body: 'You agree not to use the Service to post hate speech, harassment, spam, adult content, or any content that violates applicable laws. We reserve the right to remove content and suspend accounts that violate our Community Rules without prior notice.',
    },
    {
      title: '6. Pro Membership',
      body: 'VoteSnap Pro is a one-time purchase that grants lifetime access to Pro features. All purchases are subject to our Refund Policy. Pro features are tied to your account and are non-transferable.',
    },
    {
      title: '7. Disclaimer of Warranties',
      body: 'The Service is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that poll results are statistically representative.',
    },
    {
      title: '8. Limitation of Liability',
      body: 'To the maximum extent permitted by law, VoteSnap shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.',
    },
    {
      title: '9. Changes to Terms',
      body: 'We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of material changes via email or in-app notice.',
    },
    {
      title: '10. Contact',
      body: 'For questions about these Terms, contact us at votesnap.online@gmail.com.',
    },
  ] : [
    {
      title: '1. 條款接受',
      body: '使用 VoteSnap（「本服務」）即表示您同意受本服務條款約束。如您不同意這些條款，請勿使用本服務。',
    },
    {
      title: '2. 服務說明',
      body: 'VoteSnap 是一個社群決策平台，讓用戶發布二選一投票問題並收集社群的匿名投票。本服務「按現狀」提供，可能隨時更新或修改。',
    },
    {
      title: '3. 用戶帳號',
      body: '您可以匿名瀏覽與投票。若要發布問題，需以有效電子郵件建立帳號。您須對帳號憑證的保密性及帳號下發生的所有活動負責。',
    },
    {
      title: '4. 用戶內容',
      body: '您保留所提交內容的所有權。發布內容即授予我們在本服務範圍內展示與散布您內容的非獨家、全球性、免版稅授權。您須確保內容符合本平台社群規範。',
    },
    {
      title: '5. 禁止行為',
      body: '您同意不利用本服務發布仇恨言論、騷擾、垃圾訊息、成人內容或任何違反法律的內容。對於違反社群規範的內容，我們保留不事先通知即下架並暫停帳號的權利。',
    },
    {
      title: '6. Pro 會員',
      body: 'VoteSnap Pro 為一次性購買，享有終身 Pro 功能。所有購買均適用退款政策。Pro 功能與帳號綁定，不可轉讓。',
    },
    {
      title: '7. 免責聲明',
      body: '本服務「按現狀」提供，不附帶任何明示或暗示的保證。我們不保證服務不中斷、無錯誤，亦不保證投票結果具有統計代表性。',
    },
    {
      title: '8. 責任限制',
      body: '在法律允許的最大範圍內，VoteSnap 對因使用本服務而產生的任何間接、附帶、特殊、結果性或懲罰性損害不承擔責任。',
    },
    {
      title: '9. 條款變更',
      body: '我們可能隨時更新本條款。繼續使用本服務即表示接受新條款。重大變更將透過電子郵件或應用程式內通知告知用戶。',
    },
    {
      title: '10. 聯絡方式',
      body: '如對本條款有任何疑問，請聯絡 votesnap.online@gmail.com。',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isEn ? 'Terms of Service' : '服務條款'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEn ? `Last updated: ${updated}` : `最後更新：${updatedZh}`}
          </p>
        </div>

        <div className="space-y-6">
          {sections.map(({ title, body }) => (
            <div key={title} className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-2xl border border-white/6 text-center">
          <p className="text-gray-500 text-sm">
            {isEn ? 'Questions? ' : '有問題？'}
            <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline">
              votesnap.online@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-600">
          <Link href="/privacy" className="hover:text-gray-400">{isEn ? 'Privacy Policy' : '隱私政策'}</Link>
          <Link href="/refund" className="hover:text-gray-400">{isEn ? 'Refund Policy' : '退款政策'}</Link>
          <Link href="/rules" className="hover:text-gray-400">{isEn ? 'Community Rules' : '社群規範'}</Link>
        </div>
      </main>
    </div>
  )
}
