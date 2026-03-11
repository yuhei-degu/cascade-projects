// src/app/(public)/sc-module/page.tsx — TASK-015
import Link from "next/link"
import { ShieldCheck, Code2, Brain, Lock } from "lucide-react"

const CATEGORIES = [
  { key: "ai_threat",  label: "AI脅威対策",         icon: Brain,       color: "red",    desc: "プロンプトインジェクション・データポイズニング・モデル反転攻撃", count: 12 },
  { key: "threat",     label: "脅威・攻撃手法",      icon: ShieldCheck, color: "orange", desc: "SQLi・XSS・CSRF・フィッシング・マルウェア", count: 18 },
  { key: "coding",     label: "セキュアコーディング", icon: Code2,       color: "sky",    desc: "脆弱なコードの特定・修正・セキュアな実装パターン", count: 15 },
  { key: "crypto",     label: "暗号・PKI",           icon: Lock,        color: "violet", desc: "公開鍵暗号・電子署名・TLS・証明書管理", count: 10 },
  { key: "management", label: "セキュリティ管理",     icon: ShieldCheck, color: "teal",   desc: "ISMS・リスク管理・インシデント対応・法規制", count: 14 },
]

const COLORMAP: Record<string, string> = {
  red:    "bg-red-50 border-red-200 text-red-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  sky:    "bg-sky-50 border-sky-200 text-sky-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  teal:   "bg-teal-50 border-teal-200 text-teal-700",
}

export default function ScModulePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* ヘッダー */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          🔒 情報処理安全確保支援士（SC）
        </div>
        <h1 className="text-3xl font-black mb-3">支援士 学習モジュール</h1>
        <p className="text-gray-500">科目B長文・AI脅威・セキュアコーディングを完全網羅。2026年度CBT対応。</p>
      </div>

      {/* 科目B対策バナー */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
        <div>
          <p className="text-sky-300 text-sm font-bold mb-1">📋 科目B対策</p>
          <h2 className="text-xl font-black mb-2">長文読解 CBTシミュレーター</h2>
          <p className="text-sky-200 text-sm">25問・150分制限・本番環境に近い体験</p>
        </div>
        <Link href="/common/exam?module=SC"
          className="bg-white text-sky-900 font-black px-5 py-3 rounded-xl hover:bg-sky-50 transition-colors shrink-0">
          開始 →
        </Link>
      </div>

      {/* カテゴリグリッド */}
      <h2 className="text-lg font-bold mb-4">カテゴリ別学習</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <Link key={c.key} href={`/common/exam?module=SC&category=${c.key}`}
              className={`group p-5 rounded-2xl border-2 ${COLORMAP[c.color]} hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={24} />
                <span className="text-xs font-bold opacity-60">{c.count}問</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{c.label}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{c.desc}</p>
            </Link>
          )
        })}
      </div>

      {/* シナジーバナー */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center">
        <div className="text-3xl">🔗</div>
        <div>
          <p className="font-bold text-amber-800 mb-1">シナジー学習 — SC × AWS</p>
          <p className="text-sm text-amber-700">支援士で学ぶ理論が、AWSのどのサービスで実装されるか確認できます。</p>
        </div>
        <Link href="/common/exam?module=MIXED"
          className="ml-auto bg-amber-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-amber-600 shrink-0 text-sm">
          両方解く
        </Link>
      </div>
    </main>
  )
}
