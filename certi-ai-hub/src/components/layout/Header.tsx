"use client"
// src/components/layout/Header.tsx
import Link from "next/link"
import { Menu } from "lucide-react"
import { useSidebar } from "./SidebarContext"

export default function Header() {
  const { toggle } = useSidebar()

  return (
    <header className="h-14 bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* ハンバーガー（サイドバー開閉） */}
        <button onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          aria-label="サイドバーを開閉">
          <Menu size={20} />
        </button>

        {/* ロゴ（モバイルのみ表示） */}
        <Link href="/" className="flex items-center gap-2 font-black text-lg md:hidden">
          <span>🎓</span>
          <span>Certi-AI <span className="text-brand">Hub</span></span>
        </Link>

        {/* モバイルナビ */}
        <nav className="flex md:hidden items-center gap-4 text-sm font-medium text-gray-600 ml-auto">
          <Link href="/sc-module" className="hover:text-sc transition-colors">🔒 SC</Link>
          <Link href="/aws-module" className="hover:text-aws transition-colors">☁️ AIF</Link>
          <Link href="/common/exam?module=SC&mode=exam" className="hover:text-brand transition-colors">📋 SC</Link>
          <Link href="/common/exam?module=AIF&mode=exam" className="hover:text-aws transition-colors">📋 AIF</Link>
        </nav>

        <Link href="/dashboard"
          className="ml-auto bg-brand text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors shrink-0">
          ダッシュボード
        </Link>
      </div>
    </header>
  )
}
