'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

const RULES_ZH = [
  {
    icon: '💬',
    title: '問題規範',
    items: [
      '問題必須是二選一的決策題（選項 A / 選項 B）',
      '問題內容不得涉及仇恨、歧視、暴力或色情',
      '禁止發布個人隱私、他人資料或惡意攻擊性內容',
      '不得利用平台進行廣告宣傳或詐騙',
    ],
  },
  {
    icon: '🗳️',
    title: '投票規範',
    items: [
      '每個問題每人只能投票一次，不可更改',
      '投票完全匿名，發問者只能看到比例，無法得知誰投了什麼',
      '請根據自己的真實想法投票，不要刷票',
      '投票結果僅供參考，最終決定仍由發問者自行判斷',
    ],
  },
  {
    icon: '⏱️',
    title: '額度與限制',
    items: [
      '免費用戶每天最多發問 5 題（台灣時間 00:00 重置）',
      '已發布的問題若刪除，當日額度不予退還',
      '問題到期後結果永久保留，可在「我的問題」查看',
      'Pro 用戶享有無限發問與優先曝光',
    ],
  },
  {
    icon: '🔒',
    title: '隱私與安全',
    items: [
      '投票記錄完全匿名，平台不對外公開個人資料',
      '你的暱稱僅用於分享圖，不影響投票匿名性',
      '我們不會將你的個人資訊出售給第三方',
      '如發現違規內容，平台有權下架問題並暫停帳號',
    ],
  },
]

const RULES_EN = [
  {
    icon: '💬',
    title: 'Question Rules',
    items: [
      'Questions must be binary-choice decisions (Option A / Option B)',
      'No hate speech, discrimination, violence, or adult content',
      'No personal data, doxxing, or malicious attacks on others',
      'No spam, advertising, or fraudulent use of the platform',
    ],
  },
  {
    icon: '🗳️',
    title: 'Voting Rules',
    items: [
      'Each person can vote once per question — votes cannot be changed',
      'Voting is fully anonymous. Question owners only see percentages, not who voted',
      'Vote based on your genuine opinion — vote manipulation is prohibited',
      'Results are for reference only; the final decision always belongs to the asker',
    ],
  },
  {
    icon: '⏱️',
    title: 'Limits & Quotas',
    items: [
      'Free users can ask up to 5 questions per day (resets at midnight Taipei time)',
      'Deleting a published question does not refund your daily quota',
      'Results are stored permanently after expiry — view them in My Questions',
      'Pro users get unlimited questions and priority exposure',
    ],
  },
  {
    icon: '🔒',
    title: 'Privacy & Safety',
    items: [
      'All votes are anonymous — your personal data is never made public',
      'Your nickname is only used on shared result images',
      'We never sell your personal information to third parties',
      'We reserve the right to remove content and suspend accounts that violate these rules',
    ],
  },
]

export default function RulesPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'
  const rules = isEn ? RULES_EN : RULES_ZH

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isEn ? 'Community Rules' : '社群規範'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEn
              ? 'Keep VoteSnap a safe and fun place for everyone.'
              : '讓 VoteSnap 成為每個人都能放心使用的平台。'}
          </p>
        </div>

        <div className="space-y-4">
          {rules.map(({ icon, title, items }) => (
            <div key={title} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{icon}</span>
                <h2 className="text-base font-semibold text-white">{title}</h2>
              </div>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-[11px] text-gray-500 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-6 p-4 rounded-2xl border border-white/6 text-center">
          <p className="text-gray-500 text-sm">
            {isEn ? 'Questions or reports? ' : '有疑問或檢舉？'}
            <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline underline-offset-2">
              votesnap.online@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/ask" className="btn-gradient px-8 py-3 rounded-2xl text-sm">
            {isEn ? 'Start a Vote →' : '開始發問 →'}
          </Link>
        </div>
      </main>
    </div>
  )
}
