"use client"
// src/app/(auth)/dashboard/page.tsx — ゲストモード対応
import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Target, TrendingUp, RotateCcw, Sparkles } from "lucide-react"

interface SessionRecord {
  date: string
  module: string
  correct: number
  total: number
  pct: number
  mode: string
}

interface AnalysisResult {
  overall_score: number
  sc_score: number | null
  aif_score: number | null
  total_answered: number
  recommendation: string
  next_study_focus: string
  passing: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  ai_threat: "AI脅威", threat: "脅威・攻撃", coding: "セキュアコーディング",
  crypto: "暗号・PKI", management: "セキュリティ管理",
  bedrock: "Amazon Bedrock", responsible_ai: "責任あるAI",
  ml_basics: "ML基礎", generative_ai: "生成AI", sdk: "AWSサービス",
}

export default function DashboardPage() {
  const [sessions, setSessions]   = useState<SessionRecord[]>([])
  const [analysis, setAnalysis]   = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem("certi_sessions")
      if (raw) setSessions(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  async function runAnalysis() {
    if (!sessions.length) return
    setAnalyzing(true)
    try {
      const res  = await fetch("/api/ai/analysis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
      })
      const data = await res.json()
      if (data.data) setAnalysis(data.data)
    } finally { setAnalyzing(false) }
  }

  if (!mounted) return null

  const totalAnswered = sessions.reduce((s, r) => s + r.total, 0)
  const totalCorrect  = sessions.reduce((s, r) => s + r.correct, 0)
  const avgPct        = sessions.length ? Math.round(sessions.reduce((s, r) => s + r.pct, 0) / sessions.length) : 0
  const scSessions    = sessions.filter(s => s.module === "SC")
  const aifSessions   = sessions.filter(s => s.module === "AIF")
  const scAvg  = scSessions.length  ? Math.round(scSessions.reduce((s,r) => s + r.pct, 0)  / scSessions.length)  : null
  const aifAvg = aifSessions.length ? Math.round(aifSessions.reduce((s,r) => s + r.pct, 0) / aifSessions.length) : null
  const recent = [...sessions].reverse().slice(0, 10)

  function clearHistory() {
    if (!confirm("学習履歴をすべて削除しますか？")) return
    localStorage.removeItem("certi_sessions")
    setSessions([])
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">ダッシュボード</h1>
          <p className="text-gray-500 text-sm">ゲストモード — ブラウザに学習履歴を保存しています</p>
        </div>
        {sessions.length > 0 && (
          <button onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
            <RotateCcw size={13} />履歴を削除
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">まだ学習履歴がありません</h2>
          <p className="text-gray-400 text-sm mb-6">問題を解くと自動的に記録されます</p>
          <div className="flex gap-3 justify-center">
            <Link href="/sc-module" className="bg-brand text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
              🔒 SC問題を解く
            </Link>
            <Link href="/aws-module" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors">
              ☁️ AIF問題を解く
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* AI進捗分析 */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" />
                <h2 className="font-bold text-indigo-800">AI進捗分析</h2>
              </div>
              <button onClick={runAnalysis} disabled={analyzing}
                className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {analyzing ? "分析中..." : "分析する"}
              </button>
            </div>
            {analysis ? (
              <div className="space-y-2">
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs font-bold text-indigo-600 mb-1">📊 総合スコア: {analysis.overall_score}%</p>
                  <p className="text-sm text-indigo-800 leading-relaxed">{analysis.recommendation}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs font-bold text-violet-600 mb-1">🎯 次の学習フォーカス</p>
                  <p className="text-sm text-violet-800 font-semibold">{analysis.next_study_focus}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-indigo-500">「分析する」を押すと学習データをもとにアドバイスを表示します。</p>
            )}
          </div>

          {/* サマリーカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BookOpen, label: "総回答数",   value: totalAnswered, unit: "問", color: "text-brand" },
              { icon: Target,   label: "総正解数",   value: totalCorrect,  unit: "問", color: "text-green-600" },
              { icon: TrendingUp, label: "平均正解率", value: avgPct,       unit: "%",  color: avgPct >= 70 ? "text-green-600" : "text-amber-600" },
              { icon: BookOpen, label: "セッション数", value: sessions.length, unit: "回", color: "text-gray-600" },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
                <card.icon size={22} className={`mx-auto mb-2 ${card.color}`} />
                <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}<span className="text-sm">{card.unit}</span></p>
              </div>
            ))}
          </div>

          {/* SC/AIF別正解率 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { label: "SC 情報処理安全確保支援士", avg: scAvg, color: "bg-sky-500", light: "bg-sky-50 border-sky-200 text-sky-700" },
              { label: "AIF AWS AI Practitioner",   avg: aifAvg, color: "bg-orange-500", light: "bg-orange-50 border-orange-200 text-orange-700" },
            ].map(m => (
              <div key={m.label} className={`rounded-2xl border p-5 ${m.light}`}>
                <p className="text-xs font-bold mb-2">{m.label}</p>
                {m.avg !== null ? (
                  <>
                    <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.avg}%` }} />
                    </div>
                    <p className="text-2xl font-black">{m.avg}%</p>
                    <p className="text-xs opacity-60 mt-1">{m.avg >= 70 ? "✅ 合格ライン達成" : "目標: 70%"}</p>
                  </>
                ) : (
                  <p className="text-sm opacity-60">まだ問題を解いていません</p>
                )}
              </div>
            ))}
          </div>

          {/* 直近の履歴 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-700">直近の学習履歴</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map((s, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.module === "SC" ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700"}`}>
                    {s.module}
                  </span>
                  <span className="text-xs text-gray-400 w-20 shrink-0">{s.date}</span>
                  <span className="text-xs text-gray-500 flex-1">{s.mode === "exam" ? "📋 模擬試験" : "📚 学習"}</span>
                  <span className="text-xs text-gray-500">{s.correct}/{s.total}問</span>
                  <span className={`text-sm font-bold w-14 text-right ${s.pct >= 70 ? "text-green-600" : "text-amber-600"}`}>
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
