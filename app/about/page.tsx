'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function AboutPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-lg mx-auto">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            {isEn ? 'About VoteSnap' : 'About VoteSnap｜關於我們'}
          </h1>
        </div>

        {/* What we do */}
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            {isEn ? 'What We Do' : '我們在做什麼'}
          </h2>
          {isEn ? (
            <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
              <p>VoteSnap is an anonymous voting platform designed for people with decision fatigue.</p>
              <p>The average person makes 35,000 decisions every day. Most are small — what to eat for lunch, whether to reply to that message, does this outfit look good — but these small decisions add up, quietly draining your energy throughout the day.</p>
              <p>We believe some decisions shouldn't be carried alone. Throw your question on VoteSnap, and in minutes, the world helps you choose.</p>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
              <p>VoteSnap 是一個專為「選擇障礙」設計的匿名投票平台。</p>
              <p>每個人每天平均要做 35,000 個決定。大多數很小——午餐吃什麼、要不要回訊息、這件衣服好不好看——但這些小決定累積起來，會悄悄消耗掉一整天的精力。</p>
              <p>我們相信，有些決定不該一個人扛。把問題丟到 VoteSnap，幾分鐘內，世界會幫你選。</p>
            </div>
          )}
        </div>

        {/* Why VoteSnap */}
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            {isEn ? 'Why VoteSnap' : '為什麼是 VoteSnap'}
          </h2>
          <div className="space-y-3">
            {(isEn ? [
              { icon: '🔒', title: 'Completely anonymous', desc: 'No one knows who voted for what, so no one needs to pretend.' },
              { icon: '⚡', title: 'Fast results', desc: 'See trends in 15 minutes, get answers within an hour.' },
              { icon: '🔗', title: 'Zero-friction voting', desc: 'Friends click your link — no signup, no download, one tap to vote.' },
              { icon: '✦', title: 'Always free', desc: 'Core features are free. Post 5 questions per day at no cost.' },
            ] : [
              { icon: '🔒', title: '完全匿名', desc: '沒有人知道誰投了什麼，所以沒有人需要假裝。' },
              { icon: '⚡', title: '快速結果', desc: '15 分鐘就能看到趨勢，最快 1 小時得到答案。' },
              { icon: '🔗', title: '零摩擦投票', desc: '朋友收到連結，不用註冊、不用下載，點一下就投。' },
              { icon: '✦', title: '永遠免費', desc: '核心功能不收錢，每天可發 5 題。' },
            ]).map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What we believe */}
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            {isEn ? 'What We Believe' : '我們相信'}
          </h2>
          {isEn ? (
            <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
              <p>Decision fatigue is one of the most underrated problems of our time. Too much information, too many options, too high a cost of regret. VoteSnap won't make decisions for you — but it will distill "the world's gut feeling" into a single percentage, helping you see which way you actually lean.</p>
              <p className="text-gray-300 italic border-l-2 border-violet-500/40 pl-4">
                Often, when you see that the result isn't what you expected — that's when you realize you'd already decided.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
              <p>決策疲勞是這個時代被低估的問題。資訊太多、選項太多、後悔的成本太高。VoteSnap 不會幫你做決定——但會把「全世界的直覺」濃縮成一個百分比，讓你看清楚自己其實傾向哪一邊。</p>
              <p className="text-gray-300 italic border-l-2 border-violet-500/40 pl-4">
                很多時候，當你看到投票結果不是你期待的那個答案——你才發現自己其實早就決定了。
              </p>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">
            {isEn ? 'Contact Us' : '聯絡我們'}
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            {isEn
              ? 'For questions, partnerships, or reports:'
              : '有任何問題、合作或檢舉：'}
          </p>
          <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline text-sm">
            votesnap.online@gmail.com
          </a>
        </div>

        {/* Footer line */}
        <p className="text-center text-xs text-gray-700">
          VoteSnap © {new Date().getFullYear()} · Made with ⚡ in Taiwan
        </p>

        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400">{isEn ? 'Terms' : '服務條款'}</Link>
          <Link href="/privacy" className="hover:text-gray-400">{isEn ? 'Privacy' : '隱私政策'}</Link>
          <Link href="/refund" className="hover:text-gray-400">{isEn ? 'Refund' : '退款政策'}</Link>
          <Link href="/rules" className="hover:text-gray-400">{isEn ? 'Rules' : '社群規範'}</Link>
        </div>
      </main>
    </div>
  )
}
