"use client"
// src/app/(public)/common/calendar/page.tsx — TASK-020
import { useState } from "react"
import { Flame, Trophy, CalendarDays, Target } from "lucide-react"

// デモ用ヒートマップデータ（過去90日）
function genHeatmap() {
  const today = new Date()
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (89 - i))
    return {
      date: d.toISOString().slice(0, 10),
      count: Math.random() > 0.4 ? Math.floor(Math.random() * 20) + 1 : 0,
    }
  })
}

const HEATMAP = genHeatmap()
const STREAK = HEATMAP.slice().reverse().findIndex(d => d.count === 0)

function heatColor(count: number) {
  if (count === 0) return "bg-gray-100"
  if (count < 5)  return "bg-indigo-200"
  if (count < 10) return "bg-indigo-400"
  return "bg-indigo-600"
}

export default function CalendarPage() {
  const [examDateSC,  setExamDateSC]  = useState("2026-05-01")
  const [examDateAIF, setExamDateAIF] = useState("2026-06-15")

  const daysToSC  = Math.max(0, Math.ceil((new Date(examDateSC).getTime()  - Date.now()) / 86400000))
  const daysToAIF = Math.max(0, Math.ceil((new Date(examDateAIF).getTime() - Date.now()) / 86400000))
  const totalAnswered = HEATMAP.reduce((s, d) => s + d.count, 0)

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-2">📅 学習カレンダー</h1>
      <p className="text-gray-500 mb-8">ストリーク・進捗・試験日カウントダウンを管理</p>

      {/* ストリーク & スタッツ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Flame,       label: "ストリーク",  value: `${STREAK}日`,    color: "text-orange-500" },
          { icon: Trophy,      label: "総回答数",    value: `${totalAnswered}問`, color: "text-yellow-500" },
          { icon: Target,      label: "SC まで",     value: `${daysToSC}日`,  color: "text-sky-500" },
          { icon: CalendarDays,label: "AIF まで",    value: `${daysToAIF}日`, color: "text-orange-400" },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <Icon size={24} className={`mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* 試験日設定 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
        <h2 className="font-bold mb-4">🎯 試験日設定</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-sky-600 block mb-1">🔒 SC 試験日</span>
            <input type="date" value={examDateSC} onChange={e => setExamDateSC(e.target.value)}
              className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-orange-600 block mb-1">☁️ AIF 試験日</span>
            <input type="date" value={examDateAIF} onChange={e => setExamDateAIF(e.target.value)}
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </label>
        </div>
      </div>

      {/* ヒートマップ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold mb-4">📊 学習ヒートマップ（過去90日）</h2>
        <div className="flex flex-wrap gap-1">
          {HEATMAP.map(d => (
            <div key={d.date} title={`${d.date}: ${d.count}問`}
              className={`w-4 h-4 rounded-sm ${heatColor(d.count)} transition-colors cursor-pointer hover:ring-2 hover:ring-indigo-300`} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
          <span>少ない</span>
          {["bg-gray-100","bg-indigo-200","bg-indigo-400","bg-indigo-600"].map(c => (
            <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span>多い</span>
        </div>
      </div>
    </main>
  )
}
