'use client'

import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useLang } from '@/lib/i18n'

export default function RefundPage() {
  const { t } = useLang()
  const isEn = t('nav.vote') === 'Vote'

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isEn ? 'Refund Policy' : '退款政策'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEn ? 'Last updated: January 1, 2025' : '最後更新：2025 年 1 月 1 日'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Main policy */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              {isEn ? 'One-Time Purchase' : '一次性購買'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isEn
                ? 'VoteSnap Pro is a one-time purchase digital product. We offer a 14-day money-back guarantee from the date of purchase, no questions asked. To request a refund, contact votesnap.online@gmail.com with your order ID. Refunds are processed within 5–7 business days back to the original payment method.'
                : 'VoteSnap Pro 為一次性購買之數位商品。我們提供購買日起 14 天無條件退款。如需退款，請寄信至 votesnap.online@gmail.com 並附上訂單編號。退款將於 5–7 個工作日內退回原付款方式。'}
            </p>
          </div>

          {/* After 14 days */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              {isEn ? 'After 14 Days' : '14 天後'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isEn
                ? 'After 14 days, all sales are final. Pro features remain active for the lifetime of your account.'
                : '14 天後不再受理退款，Pro 功能將於您的帳號內永久有效。'}
            </p>
          </div>

          {/* How to request */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              {isEn ? 'How to Request a Refund' : '如何申請退款'}
            </h2>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-[11px] text-gray-500 shrink-0 mt-0.5">1</span>
                {isEn
                  ? 'Email votesnap.online@gmail.com within 14 days of purchase'
                  : '購買後 14 天內寄信至 votesnap.online@gmail.com'}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-[11px] text-gray-500 shrink-0 mt-0.5">2</span>
                {isEn
                  ? 'Include your order ID (found in your Stripe confirmation email)'
                  : '附上訂單編號（可在 Stripe 確認信中找到）'}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/6 flex items-center justify-center text-[11px] text-gray-500 shrink-0 mt-0.5">3</span>
                {isEn
                  ? 'We will process your refund within 5–7 business days'
                  : '我們將於 5–7 個工作日內處理退款'}
              </li>
            </ol>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✦</span>
              <h2 className="text-sm font-semibold text-white">
                {isEn ? 'Summary' : '摘要'}
              </h2>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                {isEn ? '14-day no-questions-asked refund' : '14 天無條件退款'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                {isEn ? 'Refunded to original payment method' : '退回原付款方式'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                {isEn ? 'Pro access active for lifetime of account' : 'Pro 功能帳號永久有效'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">·</span>
                {isEn ? 'No refunds after 14 days' : '14 天後不受理退款'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl border border-white/6 text-center">
          <p className="text-gray-500 text-sm">
            {isEn ? 'Refund requests: ' : '退款申請：'}
            <a href="mailto:votesnap.online@gmail.com" className="text-violet-400 hover:underline">
              votesnap.online@gmail.com
            </a>
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400">{isEn ? 'Terms of Service' : '服務條款'}</Link>
          <Link href="/privacy" className="hover:text-gray-400">{isEn ? 'Privacy Policy' : '隱私政策'}</Link>
          <Link href="/pricing" className="hover:text-gray-400">{isEn ? 'Pricing' : '定價'}</Link>
        </div>
      </main>
    </div>
  )
}
