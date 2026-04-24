import Link from 'next/link'
import { Logo, LogoWordmark } from '@/components/Logo'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Ask anything',
    desc: '發佈任何決定難題——要不要告白？要不要辭職？',
    icon: '💬',
  },
  {
    step: '02',
    title: 'Crowd votes',
    desc: '陌生人匿名幫你投票，沒有社交壓力。',
    icon: '🗳️',
  },
  {
    step: '03',
    title: 'Get answers fast',
    desc: '10～15 分鐘內看到真實多數意見。',
    icon: '⚡',
  },
]

const EXAMPLE_CARDS = [
  { q: '要不要主動傳訊息給他？', yes: 74, no: 26, votes: 312 },
  { q: '這件衣服值得買嗎？', yes: 58, no: 42, votes: 189 },
  { q: '要不要辭掉這份工作？', yes: 61, no: 39, votes: 244 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <LogoWordmark className="text-xl" />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="btn-gradient px-5 py-2 text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Gradient glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live — people voting right now
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-6">
            Can&apos;t decide?
            <br />
            <span className="gradient-text">Snap a vote.</span>
          </h1>

          <p className="text-xl text-gray-400 mb-4 max-w-xl mx-auto">
            Ask anything. Let the crowd vote. See your result in minutes.
          </p>
          <p className="text-base text-gray-600 mb-10">
            做不了決定？丟到 votesnap，幾分鐘，世界幫你選。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-gradient px-8 py-4 text-base">
              Start a Vote →
            </Link>
            <a
              href="#how"
              className="px-8 py-4 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 transition-colors text-base font-medium"
            >
              See How it Works
            </a>
          </div>
        </div>

        {/* Example cards */}
        <div className="relative max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EXAMPLE_CARDS.map((card, i) => (
            <div
              key={i}
              className="card p-5 text-left hover:border-white/12 transition-colors"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p className="text-white font-medium mb-4 text-sm">{card.q}</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Yes</span>
                    <span>{card.yes}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full">
                    <div
                      className="h-full gradient-bg rounded-full"
                      style={{ width: `${card.yes}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>No</span>
                    <span>{card.no}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full">
                    <div
                      className="h-full bg-white/20 rounded-full"
                      style={{ width: `${card.no}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-3">{card.votes} votes</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-gray-500 text-center mb-12">三步驟，快速得到答案</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon }) => (
              <div key={step} className="card p-6">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-xs text-gray-600 font-mono mb-2">{step}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { num: '10K+', label: 'Questions asked' },
            { num: '150K+', label: 'Votes cast' },
            { num: '<15min', label: 'Average result time' },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold gradient-text">{num}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Free to start</h2>
          <p className="text-gray-400 mb-8">
            免費用戶每天可發 3 題。升級 Pro 解鎖無限發問與優先曝光。
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="btn-gradient px-8 py-3">
              Start Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 rounded-full border border-white/15 text-gray-300 hover:bg-white/5 transition-colors font-medium"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Logo size={20} />
          <LogoWordmark className="text-base" />
        </div>
        <p>votesnap.online · {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
