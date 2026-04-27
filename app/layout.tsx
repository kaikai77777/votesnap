import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { LangToggle } from '@/components/LangToggle'
import { PushInit } from '@/components/PushInit'

export const metadata: Metadata = {
  title: 'votesnap — Can\'t decide? Snap a vote.',
  description: 'Ask anything. Let the crowd vote. See your result in minutes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://votesnap.online'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'votesnap',
  },
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
      <head>
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/logo-icon.png" />
      </head>
      <body><Providers>{children}<LangToggle /><PushInit /></Providers></body>
    </html>
  )
}
