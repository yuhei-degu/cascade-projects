// src/app/(public)/sc-module/page.tsx
"use client"
import Link from "next/link"
import { ShieldCheck, Code2, Brain, Lock } from "lucide-react"
import { SqlInjectionLab } from "@/components/lab/SqlInjectionLab"
import { PromptInjectionLab } from "@/components/lab/PromptInjectionLab"

const CATEGORIES = [
  { key: "ai_threat",  label: "AI脇威対策",         icon: Brain,       color: "red",    desc: "プロンプトインジェクション・データポイズニング・モデル反転攻撃" },
  { key: "threat",     label: "脇威・攻撃手法",      icon: ShieldCheck, color: "orange", desc: "SQLi・XSS・CSRF・フィッシング・マルウェア" },
  { key: "coding",     label: "セキュアコーディング", icon: Code2,       color: "sky",    desc: "脆弱なコードの特定・修正・セキュアな実装パターン" },
  { key: "crypto",     label: "暗号・PKI",           icon: Lock,        color: "violet", desc: "公開鍵暗号・電子署名・TLS・証明書管理" },
  { key: "management", label: "セキュリティ管理",     icon: ShieldCheck, color: "teal",   desc: "ISMS・リスク管理・インシデント対応・法規制" },
]

const COLORMAP: Record<string, string> = {
  red:    "bg-red-50 border-red-200 text-red-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  sky:    "bg-sky-50 border-sky-200 text-sky-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  teal:   "bg-teal-50 border-teal-200 text-teal-700",
}

const DIFFICULTIES = [
  { value: "",  label: "全問題",   icon: "📚", desc: "難易度まぜこぜ10問" },
  { value: "1", label: "必須問題", icon: "⭐",  desc: "基本・頻出問題" },
  { value: "2", label: "標準問題", icon: "⭐⭐", desc: "本試験レベル" },
  { value: "3", label: "難問",     icon: "⭐⭐⭐", desc: "応用・難問のみ" },
]

export default function ScModulePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          🔒 情報処理安全確保支援士（SC）
        </div>
        <h1 className="text-3xl font-black mb-3">情報処理安全確保支援士 学習モジュール</h1>
        <p className="text-gray-500">科目B長文・AI脇威・セキュアコーディングを完全網羅。2026年度CBT対応。</p>
      </div>

      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
        <div>
          <p className="text-sky-300 text-sm font-bold mb-1">📋 本番形式</p>
          <h2 className="text-xl font-black mb-1">SC 模擬試験</h2>
          <p className="text-sky-200 text-sm">20問・解説なし・全問終了後に結果＆解説</p>
        </div>
        <Link href="/common/exam?module=SC&mode=exam"
          className="bg-white text-sky-900 font-black px-5 py-3 rounded-xl hover:bg-sky-50 transition-colors shrink-0">
          開始 →
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">難易度で選ぶ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DIFFICULTIES.map(d => (
            <Link key={d.value}
              href={`/common/exam?module=SC${d.value ? `&difficulty=${d.value}` : ""}`}
              className="flex flex-col items-center gap-1 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-brand hover:shadow-md transition-all text-center">
              <span className="text-2xl">{d.icon}</span>
              <span className="font-bold text-sm text-gray-800">{d.label}</span>
              <span className="text-xs text-gray-400">{d.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">カテゴリで選ぶ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <div key={c.key} className={`p-5 rounded-2xl border-2 ${COLORMAP[c.color]}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={20} />
                <h3 className="font-bold">{c.label}</h3>
              </div>
              <p className="text-xs opacity-70 mb-3 leading-relaxed">{c.desc}</p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/common/exam?module=SC&category=${c.key}`} className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">📚 全問</Link>
                <Link href={`/common/exam?module=SC&category=${c.key}&difficulty=1`} className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">⭐ 必須</Link>
                <Link href={`/common/exam?module=SC&category=${c.key}&difficulty=2`} className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">⭐⭐ 標準</Link>
                <Link href={`/common/exam?module=SC&category=${c.key}&difficulty=3`} className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">⭐⭐⭐ 難問</Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center mb-12">
        <div className="text-3xl">🔗</div>
        <div>
          <p className="font-bold text-amber-800 mb-1">シナジー学習 — SC × AWS</p>
          <p className="text-sm text-amber-700">支援士で学ぶ理論が、AWSのどのサービスで実装されるか確認できます。</p>
        </div>
        <Link href="/common/exam?module=MIXED" className="ml-auto bg-amber-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-amber-600 shrink-0 text-sm">両方解く</Link>
      </div>

      <div className="mb-4">
        <div className="inline-block bg-red-500/10 text-red-600 text-sm font-bold px-3 py-1.5 rounded-full mb-4">💻 Interactive Lab</div>
        <h2 className="text-xl font-black mb-1">攻撃を体験して理解する</h2>
        <p className="text-gray-500 text-sm mb-8">実際に攻撃を試すことで、防御策の重要性を体感できます。</p>
      </div>
      <div className="space-y-8">
        <div>
          <h3 className="text-base font-bold text-gray-700 mb-3">🗄️ SQLインジェクション</h3>
          <SqlInjectionLab />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-700 mb-3">🤖 プロンプトインジェクション</h3>
          <PromptInjectionLab />
        </div>
      </div>
    </main>
  )
}
