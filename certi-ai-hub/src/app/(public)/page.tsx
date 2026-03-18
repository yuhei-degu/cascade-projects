// src/app/(public)/page.tsx
import Link from "next/link"
import { PromptInjectionLab } from "@/components/lab/PromptInjectionLab"

const FEATURES = [
  { icon: "🔒", title: "SC 完全対応",       desc: "科目B・セキュアコーディング・AI脅威問題",     href: "/sc-module",       color: "hover:border-sky-300" },
  { icon: "☁️", title: "AIF 完全対応",       desc: "Bedrock・SageMaker・Responsible AI・SDK問題", href: "/aws-module",      color: "hover:border-orange-300" },
  { icon: "🔗", title: "シナジー学習",        desc: "SC理論とAWS実装の相互リンクで理解を深める",   href: "/synergy",         color: "hover:border-amber-300" },
  { icon: "💻", title: "Interactive Lab",    desc: "SQLi・プロンプトインジェクションを体験",       href: "/sc-module",       color: "hover:border-red-300" },
  { icon: "📊", title: "ダッシュボード",      desc: "学習履歴・正解率・弱点を自動集計",             href: "/dashboard",       color: "hover:border-indigo-300" },
  { icon: "📅", title: "試験日カレンダー",    desc: "試験日カウントダウンと学習フェーズガイド",     href: "/common/calendar", color: "hover:border-violet-300" },
]

export default function HomePage() {
  return (
    <main>
      {/* ヒーロー */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-2 rounded-full mb-8">
            ✨ 2026年度CBT方式対応 — SC × AIF 統合プラットフォーム
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
            <span className="text-sky-400">支援士（SC）</span>と{" "}
            <span className="text-orange-400">AWS AIF</span>を<br />
            <span className="text-white">同時に合格する</span>
          </h1>
          <p className="text-indigo-200 mb-10 text-sm leading-relaxed">
            AI脅威の理論（SC）をAWSで実装する（AIF）<br />
            シナジー学習で理解を深める
          </p>

          {/* SC / AIF 2列ボタン */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-4">
            <div className="bg-white/5 border border-sky-400/20 rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-sky-300 text-xs font-bold">🔒 情報処理安全確保支援士（SC）</p>
              <Link href="/common/exam?module=SC&mode=exam"
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 rounded-xl transition-colors text-sm text-center">
                📋 模擬試験（SC）
              </Link>
              <Link href="/sc-module"
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-xl transition-colors text-sm text-center">
                📚 カテゴリ別に学ぶ
              </Link>
            </div>
            <div className="bg-white/5 border border-orange-400/20 rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-orange-300 text-xs font-bold">☁️ AWS Certified AI Practitioner（AIF）</p>
              <Link href="/common/exam?module=AIF&mode=exam"
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl transition-colors text-sm text-center">
                📋 模擬試験（AIF）
              </Link>
              <Link href="/aws-module"
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-xl transition-colors text-sm text-center">
                📚 カテゴリ別に学ぶ
              </Link>
            </div>
          </div>

          {/* シナジーボタン */}
          <Link href="/common/exam?module=MIXED"
            className="inline-flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
            🔗 SC × AIF シナジー模擬試験
          </Link>
        </div>
      </section>

      {/* 機能グリッド */}
      <section className="py-14 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Link key={f.title} href={f.href as string}
              className={`bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all ${f.color}`}>
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="font-bold text-base mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive Lab デモ */}
      <section className="py-14 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-full mb-3">
              💻 Interactive Lab
            </div>
            <h2 className="text-2xl font-black text-white mb-2">プロンプトインジェクションを体験する</h2>
            <p className="text-gray-400 text-sm">AIシステムへの攻撃と防御をブラウザで体験。SC試験の頻出問題です。</p>
          </div>
          <PromptInjectionLab />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-2xl font-black mb-3">2026年の試験に向けて、今日から始めよう</h2>
        <p className="text-gray-500 text-sm mb-8">模擬試験・カテゴリ別学習・シナジーマップがすべて無料</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/common/exam?module=SC&mode=exam"
            className="bg-sky-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-sky-500 transition-colors shadow-lg">
            📋 SC模擬試験を始める
          </Link>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-orange-500 transition-colors shadow-lg">
            📋 AIF模擬試験を始める
          </Link>
        </div>
      </section>
    </main>
  )
}
