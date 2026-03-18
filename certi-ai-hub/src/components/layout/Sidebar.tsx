"use client"
// src/components/layout/Sidebar.tsx
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useSidebar } from "./SidebarContext"

export default function Sidebar() {
  const { open, toggle } = useSidebar()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={toggle} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200
        flex flex-col p-4 transition-all duration-300 ease-in-out overflow-y-auto
        ${open ? "w-72 translate-x-0" : "w-72 -translate-x-full"}
        md:relative md:translate-x-0 md:flex
        ${open ? "md:w-72" : "md:w-0 md:p-0 md:border-0 md:overflow-hidden"}
      `}>
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2 font-black text-xl mb-4 shrink-0">
          <span className="text-2xl">🎓</span>
          <span className="whitespace-nowrap">Certi-AI <span className="text-brand">Hub</span></span>
        </Link>

        {/* ナビ */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {/* 学習 */}
          <p className="text-xs font-bold text-gray-400 px-3 pt-2 pb-1 uppercase tracking-wide">学習</p>
          <Link href="/sc-module"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-sc-light text-sc font-medium text-sm whitespace-nowrap transition-colors">
            🔒 情報処理安全確保支援士（SC）
          </Link>
          <Link href="/aws-module"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-aws-light text-aws font-medium text-sm whitespace-nowrap transition-colors">
            ☁️ AWS Certified AI Practitioner（AIF）
          </Link>
          <Link href="/synergy"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-amber-50 text-amber-600 font-medium text-sm whitespace-nowrap transition-colors">
            🔗 SC×AIFシナジーマップ
          </Link>

          {/* 試験 */}
          <p className="text-xs font-bold text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">模擬試験</p>
          <Link href="/common/exam?module=SC&mode=exam"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-indigo-50 text-brand font-medium text-sm whitespace-nowrap transition-colors">
            📋 模擬試験（SC）
          </Link>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-orange-50 text-aws font-medium text-sm whitespace-nowrap transition-colors">
            📋 模擬試験（AIF）
          </Link>

          {/* ツール */}
          <p className="text-xs font-bold text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">ツール</p>
          <Link href="/dashboard"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-indigo-50 text-brand font-medium text-sm whitespace-nowrap transition-colors">
            📊 ダッシュボード
          </Link>
          <Link href="/common/calendar"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-indigo-50 text-brand font-medium text-sm whitespace-nowrap transition-colors">
            📅 試験日カレンダー
          </Link>
        </nav>

        {/* 閉じるボタン */}
        <button onClick={toggle}
          className="hidden md:flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-2 mt-2 transition-colors shrink-0">
          <ChevronLeft size={14} />サイドバーを閉じる
        </button>
      </aside>
    </>
  )
}
