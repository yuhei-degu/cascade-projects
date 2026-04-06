// app/layout.tsx
// RamenFlow ルートレイアウト
// Noto Serif JP（客向け・温かみ）+ Noto Sans JP（スタッフ・視認性）を設定

import type { Metadata, Viewport } from 'next'
import { Noto_Serif_JP, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

// ---- フォント設定 ----
const notoSerifJP = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
  preload: false, // 日本語フォントはpreloadしない（ファイルサイズ大）
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
})

// ---- メタデータ ----
export const metadata: Metadata = {
  title: {
    default: 'RamenFlow',
    template: '%s | RamenFlow',
  },
  description: 'QRコードで簡単注文。待ち時間もわかるラーメン店向けシステム',
  // PWA 対応（フェーズ3で manifest.json を追加）
  // manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // スマホでの意図しない拡大を防ぐ
  userScalable: false,
  themeColor: '#C0392B', // brand-red
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ja"
      className={`${notoSerifJP.variable} ${notoSansJP.variable}`}
    >
      <body className="bg-brand-cream text-brand-dark antialiased">
        {children}
      </body>
    </html>
  )
}
