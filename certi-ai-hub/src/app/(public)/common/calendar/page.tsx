"use client"
// src/app/(public)/common/calendar/page.tsx
import { useEffect, useState } from "react"
import Link from "next/link"
import { Target, BookOpen, Clock } from "lucide-react"

interface ExamDates {
  sc: string
  aif: string
}

const STUDY_PLAN = [
  {
    days: 180, label: "6ヶ月前〜",
    sc: ["SC：1日1〜2時間を目標に必須問題を一周", "苦手カテゴリを特定して重点学習"],
    aif: ["AIF：1日30分〜1時間でAWS基礎を固める", "Bedrockの基本概念を把握"],
    color: "bg-green-50 border-green-200 text-green-700"
  },
  {
    days: 90, label: "3ヶ月前〜",
    sc: ["SC：標準問題に挑戦・シナジー学習開始", "科目B長文読解の練習"],
    aif: ["AIF：Responsible AI・ML基礎を重点学習", "AWS公式ドキュメントで補強"],
    color: "bg-sky-50 border-sky-200 text-sky-700"
  },
  {
    days: 30, label: "1ヶ月前〜",
    sc: ["SC：難問チャレンジ・模擬試験を週2〜3回", "間違えた問題を繰り返し復習"],
    aif: ["AIF：模擬試験で弱点洗い出し", "SDKサービスの使い分けを整理"],
    color: "bg-violet-50 border-violet-200 text-violet-700"
  },
  {
    days: 14, label: "2週間前〜",
    sc: ["SC：模擬試験を毎日1回（20問）", "正解率70%以上を安定させる"],
    aif: ["AIF：全カテゴリ総復習", "模擬試験を毎日1回"],
    color: "bg-amber-50 border-amber-200 text-amber-700"
  },
  {
    days: 7, label: "1週間前〜",
    sc: ["SC：最終確認・弱点の洗い出し", "体調管理・睡眠重視"],
    aif: ["AIF：新しいことをやらず復習に徹する", "体調管理・睡眠重視"],
    color: "bg-red-50 border-red-200 text-red-700"
  },
]

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getCurrentPhase(days: number | null) {
  if (days === null) return null
  return STUDY_PLAN.find(p => days >= p.days) ?? STUDY_PLAN[STUDY_PLAN.length - 1]
}

export default function CalendarPage() {
  const [dates, setDates]   = useState<ExamDates>({ sc: "", aif: "" })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem("certi_exam_dates")
      if (raw) setDates(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  function handleChange(key: "sc" | "aif", value: string) {
    const next = { ...dates, [key]: value }
    setDates(next)
    localStorage.setItem("certi_exam_dates", JSON.stringify(next))
  }

  if (!mounted) return null

  const scDays   = daysUntil(dates.sc)
  const aifDays  = daysUntil(dates.aif)
  const scPhase  = getCurrentPhase(scDays)
  const aifPhase = getCurrentPhase(aifDays)

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-brand text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          📅 学習カレンダー
        </div>
        <h1 className="text-3xl font-black mb-2">試験日カウントダウン</h1>
        <p className="text-gray-500 text-sm">試験日を設定すると、残り日数と学習フェーズが表示されます。</p>
      </div>

      {/* 必要学習時間の目安 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <h2 className="font-black text-gray-700 mb-3">⏱ 必要学習時間の目安</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-500 font-bold text-xs">試験</th>
                <th className="text-center py-2 px-3 text-gray-500 font-bold text-xs">資格未経験</th>
                <th className="text-center py-2 px-3 text-sky-600 font-bold text-xs">IT経験者</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-3 pr-4">
                  <span className="font-bold text-sky-700">🔒 SC（セキスペ）</span>
                </td>
                <td className="text-center py-3 px-3 text-gray-600 font-medium">300〜500時間</td>
                <td className="text-center py-3 px-3 text-sky-700 font-bold">120〜200時間</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="font-bold text-orange-700">☁️ AIF</span>
                </td>
                <td className="text-center py-3 px-3 text-gray-600 font-medium">40〜80時間</td>
                <td className="text-center py-3 px-3 text-orange-700 font-bold">20〜40時間</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">※ IT経験者（システム開発・運用経験あり）の場合の目安です</p>
      </div>

      {/* 試験日設定 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { key: "sc" as const,  label: "🔒 SC 試験日", color: "border-sky-300 focus:ring-sky-400" },
          { key: "aif" as const, label: "☁️ AIF 試験日", color: "border-orange-300 focus:ring-orange-400" },
        ].map(f => (
          <div key={f.key} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">{f.label}</label>
            <input type="date" value={dates[f.key]} onChange={e => handleChange(f.key, e.target.value)}
              className={`w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${f.color}`} />
          </div>
        ))}
      </div>

      {/* カウントダウン */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: "SC", days: scDays,  phase: scPhase,  href: "/sc-module",  exam: "?module=SC&mode=exam",  color: "from-sky-900 to-indigo-900" },
          { label: "AIF", days: aifDays, phase: aifPhase, href: "/aws-module", exam: "?module=AIF&mode=exam", color: "from-orange-900 to-amber-800" },
        ].map(m => (
          <div key={m.label} className={`bg-gradient-to-br ${m.color} text-white rounded-2xl p-6`}>
            <p className="text-white/60 text-xs font-bold mb-1">{m.label} 試験まで</p>
            {m.days !== null ? (
              <>
                <p className="text-5xl font-black mb-1">{m.days > 0 ? m.days : 0}<span className="text-xl ml-1">日</span></p>
                {m.days <= 0 && <p className="text-white/70 text-xs">試験日が過ぎました</p>}
                {m.phase && m.days > 0 && (
                  <p className="text-white/70 text-xs mt-2">📍 {m.phase.label}</p>
                )}
              </>
            ) : (
              <p className="text-white/60 text-sm mt-2">試験日を設定してください</p>
            )}
            <div className="flex gap-2 mt-4">
              <Link href={m.href as string} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                <BookOpen size={12} className="inline mr-1" />学習
              </Link>
              <Link href={`/common/exam${m.exam}` as string} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                <Target size={12} className="inline mr-1" />模擬試験
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 学習フェーズガイド */}
      <h2 className="text-lg font-black mb-4">📚 学習フェーズガイド</h2>
      <div className="space-y-3">
        {STUDY_PLAN.map((p, i) => {
          const isCurrentSC  = scPhase  === p && scDays  !== null && scDays  > 0
          const isCurrentAIF = aifPhase === p && aifDays !== null && aifDays > 0
          const isCurrent = isCurrentSC || isCurrentAIF
          return (
            <div key={i} className={`rounded-2xl border-2 p-4 transition-all ${p.color} ${isCurrent ? "ring-2 ring-offset-2 ring-brand" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                {isCurrent && <span className="text-xs font-black bg-brand text-white px-2 py-0.5 rounded-full">現在のフェーズ</span>}
                <span className="font-bold text-sm">{p.label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold opacity-60 mb-1">🔒 SC</p>
                  <ul className="space-y-1">
                    {p.sc.map((t, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5">
                        <Clock size={10} className="mt-0.5 shrink-0 opacity-50" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold opacity-60 mb-1">☁️ AIF</p>
                  <ul className="space-y-1">
                    {p.aif.map((t, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5">
                        <Clock size={10} className="mt-0.5 shrink-0 opacity-50" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
