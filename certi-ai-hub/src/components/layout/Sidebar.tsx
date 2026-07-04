"use client"

import Link from "next/link"
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  Cloud,
  Gauge,
  Layers,
  PanelLeftClose,
  ShieldCheck,
  Shuffle,
} from "lucide-react"
import { useSidebar } from "./SidebarContext"

const groups = [
  {
    label: "学習",
    items: [
      { href: "/sc-module", label: "SC対策", icon: ShieldCheck, tone: "text-sky-700" },
      { href: "/aws-module", label: "AWS AIF対策", icon: Cloud, tone: "text-orange-700" },
      { href: "/synergy", label: "SC × AIF 連携", icon: Layers, tone: "text-amber-700" },
    ],
  },
  {
    label: "試験",
    items: [
      { href: "/common/exam?module=MIXED", label: "混合10問", icon: Shuffle, tone: "text-indigo-700" },
      { href: "/common/exam?module=SC&mode=exam", label: "SC模擬試験", icon: BookOpen, tone: "text-sky-700" },
      { href: "/common/exam?module=AIF&mode=exam", label: "AIF模擬試験", icon: BookOpen, tone: "text-orange-700" },
    ],
  },
  {
    label: "管理",
    items: [
      { href: "/dashboard", label: "ダッシュボード", icon: Gauge, tone: "text-slate-700" },
      { href: "/common/calendar", label: "試験日カレンダー", icon: CalendarDays, tone: "text-slate-700" },
    ],
  },
]

export default function Sidebar() {
  const { open, toggle, close } = useSidebar()

  return (
    <>
      {open && <button aria-label="サイドバーを閉じる" className="fixed inset-0 z-30 bg-slate-950/35 md:hidden" onClick={toggle} />}
      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-full flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-xl transition-all duration-300
          ${open ? "w-72 translate-x-0" : "w-72 -translate-x-full"}
          md:relative md:translate-x-0 md:shadow-none
          ${open ? "md:w-72" : "md:w-0 md:border-0 md:p-0 md:overflow-hidden"}
        `}
      >
        <Link href="/" onClick={close} className="mb-5 flex items-center gap-2 rounded-md px-2 py-1.5 font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-200">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm text-white">AI</span>
          <span className="whitespace-nowrap">Certi-AI Hub</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <Icon size={17} className={item.tone} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={toggle}
          className="mt-5 hidden items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 md:flex"
        >
          {open ? <ChevronLeft size={14} /> : <PanelLeftClose size={14} />}
          サイドバーを閉じる
        </button>
      </aside>
    </>
  )
}
