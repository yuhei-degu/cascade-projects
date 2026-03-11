// src/app/(public)/page.tsx — ランディングページ
import Link from "next/link"
import { PromptInjectionLab } from "@/components/lab/PromptInjectionLab"

const FEATURES = [
  { icon: "🔒", color: "sc", title: "支援士（SC）完全対応",  desc: "科目B長文・セキュアコーディング・最新AI脅威問題" },
  { icon: "☁️", color: "aws", title: "AWS AIF完全対応",       desc: "Bedrock/SageMaker・Responsible AI・SDK問題" },
  { icon: "🔗", color: "brand", title: "シナジー学習",         desc: "SC理論 ↔ AWS実装を相互リンクで効率化" },
  { icon: "🤖", color: "brand", title: "AI進捗分析",           desc: "弱点を自動特定・合格予測・パーソナル学習プラン" },
  { icon: "💻", color: "sc", title: "Interactive Lab",        desc: "ブラウザでプロンプトインジェクション体験" },
  { icon: "📊", color: "aws", title: "CBT模擬試験エンジン",   desc: "時間制限・ランダム出題・本番環境に近い体験" },
]

export default function HomePage() {
  return (
    <main>
      {/* ヒーロー */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white pt-20 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-2 rounded-full mb-8">
            ✨ 2026年度CBT方式対応 — SC × AIF 統合プラットフォーム
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">
            <span className="text-sky-400">支援士（SC）</span>と<br />
            <span className="text-orange-400">AWS AIF</span>を<br />
            <span className="text-white">同時に合格する</span>
          </h1>
          <p className="text-lg text-indigo-200 mb-10 leading-relaxed">
            AI脅威の理論（SC）をAWSで実装する（AIF）<br />
            シナジー学習で学習時間を30%短縮
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/common/exam" className="bg-white text-indigo-900 font-black text-lg px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl">
              📝 今すぐ模擬試験を始める
            </Link>
            <Link href="/sc-module" className="bg-white/10 border border-white/30 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors">
              🔒 SC問題を解く
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">なぜ両方同時に学ぶのか</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div
                className={`text-3xl mb-3 ${
                  f.color === "sc"
                    ? "text-sky-500"
                    : f.color === "aws"
                    ? "text-orange-500"
                    : "text-indigo-500"
                }`}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Lab デモ */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-full mb-4">
              💻 Interactive Lab — ブラウザで体験
            </div>
            <h2 className="text-2xl font-black text-white mb-2">プロンプトインジェクションを体験する</h2>
            <p className="text-gray-400 text-sm">AIシステムへの攻撃と防御（Guardrail）をブラウザで体験。SC試験の頻出問題です。</p>
          </div>
          <PromptInjectionLab />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">2026年の試験に向けて、今日から始めよう</h2>
        <p className="text-gray-500 mb-8">無料で5問体験できます。</p>
        <Link href="/common/exam" className="inline-block bg-brand text-white font-black text-xl px-10 py-5 rounded-2xl hover:bg-brand-dark transition-colors shadow-xl shadow-indigo-100">
          ⚡ 無料で始める →
        </Link>
      </section>
    </main>
  )
}
