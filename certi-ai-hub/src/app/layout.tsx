// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// global font
const inter = Inter({ subsets: ["latin", "japanese"], display: "swap" })

export const metadata: Metadata = {
  title: "Certi-AI Hub | SC × AIF 資格学習プラットフォーム",
  description: "情報処理安全確保支援士(SC)とAWS AI Practitioner(AIF)を統合学習。CBT対応・AI進捗分析・シナジー学習機能搭載。",
}

import { Header, Sidebar } from "../components/layout"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.className}>
      <body>
        <div className="flex min-h-screen">
          {/* desktop sidebar */}
          <Sidebar />

          <div className="flex-1 flex flex-col">
            {/* header stays at top of content column */}
            <Header />

            <main className="flex-1">
              {children}
            </main>

            <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
              <p className="font-bold text-gray-600 mb-1">🎓 Certi-AI Hub</p>
              <p>SC × AIF 統合学習プラットフォーム — 2026年度CBT対応</p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
