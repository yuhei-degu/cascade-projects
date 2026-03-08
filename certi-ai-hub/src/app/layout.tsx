// src/app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Certi-AI Hub | SC × AIF 資格学習プラットフォーム",
  description: "情報処理安全確保支援士(SC)とAWS AI Practitioner(AIF)を統合学習。CBT対応・AI進捗分析・シナジー学習機能搭載。",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="h-14 bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur">
          <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-black text-xl">
              <span className="text-2xl">🎓</span>
              <span>Certi-AI <span className="text-brand">Hub</span></span>
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/sc-module"   className="flex items-center gap-1 hover:text-sc transition-colors">🔒 SC（支援士）</a>
              <a href="/aws-module"  className="flex items-center gap-1 hover:text-aws transition-colors">☁️ AIF（AWS）</a>
              <a href="/common/exam" className="hover:text-brand transition-colors">📝 模擬試験</a>
            </nav>
            <a href="/dashboard" className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors">
              ダッシュボード
            </a>
          </div>
        </header>
        {children}
        <footer className="border-t border-gray-100 py-10 mt-20 text-center text-sm text-gray-400">
          <p className="font-bold text-gray-600 mb-1">🎓 Certi-AI Hub</p>
          <p>SC × AIF 統合学習プラットフォーム — 2026年度CBT対応</p>
        </footer>
      </body>
    </html>
  )
}
