import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'votesnap — Can\'t decide? Snap a vote.',
  description: 'Ask anything. Let the crowd vote. See your result in minutes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://votesnap.online'),
  openGraph: {
    title: 'votesnap',
    description: 'Can\'t decide? Snap a vote. Get your answer.',
    url: 'https://votesnap.online',
    siteName: 'votesnap',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
