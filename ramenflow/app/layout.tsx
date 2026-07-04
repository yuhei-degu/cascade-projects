import type { Metadata, Viewport } from 'next'
import { Suspense, type ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'RamenFlow',
    template: '%s | RamenFlow',
  },
  description: 'QRコードで簡単注文。待ち時間もわかるラーメン店向けシステム',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#C0392B',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-brand-cream text-brand-dark antialiased">
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
