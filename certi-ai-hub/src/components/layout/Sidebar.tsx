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
        fixed top-0 left-0 h-full z-40 bg-slate-50/70 backdrop-blur-2xl border-r border-slate-200/50
        flex flex-col p-4 transition-all duration-300 ease-in-out overflow-y-auto
        ${open ? "w-72 translate-x-0" : "w-72 -translate-x-full"}
        md:relative md:translate-x-0 md:flex
        ${open ? "md:w-72" : "md:w-0 md:p-0 md:border-0 md:overflow-hidden"}
      `}>
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2 font-black text-xl mb-4 shrink-0 tracking-tight">
          <span className="text-2xl drop-shadow-sm">🎓</span>
          <span className="whitespace-nowrap text-slate-900">Certi-AI <span className="text-indigo-600">Hub</span></span>
        </Link>

        {/* ナビ */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {/* 学習 */}
          <p className="text-[10px] font-bold text-slate-400 px-3 pt-2 pb-1 uppercase tracking-wider">学習</p>
          <Link href="/sc-module"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-sky-100/50 text-sky-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-sky-200">
            <span className="text-base">🔒</span> 情報処理安全確保支援士（SC）
          </Link>
          <Link href="/aws-module"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-orange-100/50 text-orange-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-orange-200">
            <span className="text-base">☁️</span> AWS AI Practitioner（AIF）
          </Link>
          <Link href="/synergy"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-amber-100/50 text-amber-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-amber-200">
            <span className="text-base">🔗</span> SC×AIFシナジーマップ
          </Link>

          {/* 試験 */}
          <p className="text-[10px] font-bold text-slate-400 px-3 pt-4 pb-1 uppercase tracking-wider">模擬試験</p>
          <Link href="/common/exam?module=SC&mode=exam"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-indigo-50/80 text-indigo-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <span className="text-base">📋</span> 模擬試験（SC）
          </Link>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-orange-50/80 text-orange-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <span className="text-base">📋</span> 模擬試験（AIF）
          </Link>

          {/* ツール */}
          <p className="text-[10px] font-bold text-slate-400 px-3 pt-4 pb-1 uppercase tracking-wider">ツール</p>
          <Link href="/dashboard"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-200/50 text-slate-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-slate-200">
            <span className="text-base">📊</span> ダッシュボード
          </Link>
          <Link href="/common/calendar"
            className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-200/50 text-slate-700 font-semibold text-sm whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-slate-200">
            <span className="text-base">📅</span> 試験日カレンダー
          </Link>
        </nav>

        {/* 閉じるボタン */}
        <button onClick={toggle}
          className="hidden md:flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 py-2.5 mt-4 hover:bg-slate-200/50 rounded-xl transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-200">
          <ChevronLeft size={14} />サイドバーを閉じる
        </button>
      </aside>
    </>
  )
}
