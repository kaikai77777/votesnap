import Link from 'next/link'
import { Logo, LogoWordmark } from '@/components/Logo'

const FREE_FEATURES = [
  '每日 3 個問題',
  '標準曝光排序',
  '基本結果頁',
  'Google 登入',
]

const PRO_FEATURES = [
  '無限發問',
  '2x 投票曝光速度',
  '優先排隊分發',
  '詳細人口統計洞察',
  '問題置頂功能',
  '進階情緒分析',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <LogoWordmark className="text-xl" />
          </Link>
          <Link href="/login" className="btn-gradient px-5 py-2 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="text-center mb-12 max-w-xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">Simple pricing</h1>
          <p className="text-gray-400">
            從免費開始，準備好了再升級。
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="card p-8">
            <h2 className="text-xl font-bold mb-1">Free</h2>
            <p className="text-gray-500 text-sm mb-6">適合試試看的人</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold">$0</span>
              <span className="text-gray-500 text-sm ml-2">/ month</span>
            </div>
            <Link
              href="/login"
              className="block w-full py-3.5 rounded-2xl border border-white/15 text-center text-white font-medium hover:bg-white/5 transition-colors mb-6"
            >
              Start Free
            </Link>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400 text-base">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="gradient-border p-8 rounded-2xl relative overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Pro</h2>
                <span className="px-2 py-0.5 rounded-full text-xs gradient-bg font-medium">
                  Coming Soon
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-6">認真做決定的人</p>
              <div className="mb-6">
                <span className="text-5xl font-extrabold gradient-text">$9</span>
                <span className="text-gray-500 text-sm ml-2">/ month</span>
              </div>
              <button
                disabled
                className="block w-full py-3.5 rounded-2xl gradient-bg text-center text-white font-medium opacity-60 cursor-not-allowed mb-6"
              >
                Coming Soon
              </button>
              <ul className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="gradient-text text-base font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: '問題到期後還能看嗎？', a: '可以，結果會永久保留在 My Questions 頁面。' },
              { q: '投票是完全匿名的嗎？', a: '是的，發問者只看得到投票比例，無法看到誰投了什麼。' },
              { q: '每日 3 題的限制怎麼計算？', a: '從每天 00:00 重置，Pro 用戶無限制。' },
            ].map(({ q, a }) => (
              <div key={q} className="card p-5">
                <p className="text-white font-medium mb-2 text-sm">{q}</p>
                <p className="text-gray-500 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
