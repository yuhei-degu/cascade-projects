import type { Metadata, Viewport } from 'next'
import './globals.css'

const title = 'Lunaria | AI日記'
const description = 'Lunariaは、AIとの会話を通じて日々の気持ちや出来事を記録できる日本語の日記アプリです。'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080706',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
