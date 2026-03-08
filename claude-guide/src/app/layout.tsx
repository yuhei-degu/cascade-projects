// src/app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Claude Code 超入門ガイド | 誰でもAI開発できる",
  description: "IT未経験・英語が苦手な方でもClaude Codeでアプリ開発ができる、日本語完全対応の学習サイト",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* ヘッダー */}
        <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-black text-xl">
              <span className="text-2xl">⚡</span>
              <span>Claude Code 入門</span>
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/start" className="hover:text-violet-600 transition-colors">🔰 初心者モード</a>
              <a href="/learn" className="hover:text-violet-600 transition-colors">📚 学習ツリー</a>
              <a href="/error" className="hover:text-violet-600 transition-colors">🆘 エラー診断</a>
              <a href="/prompts" className="hover:text-violet-600 transition-colors">🚀 プロンプト生成</a>
            </nav>
            <a href="/start" className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              無料で始める
            </a>
          </div>
        </header>

        {children}

        {/* フッター */}
        <footer className="border-t border-gray-100 py-12 mt-20">
          <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
            <p className="font-bold text-gray-700 mb-2">⚡ Claude Code 超入門ガイド</p>
            <p>IT未経験の方でも「このサイトだけ」でAI開発ができるようになることを目指しています</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
