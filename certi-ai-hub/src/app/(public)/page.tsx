// src/app/(public)/page.tsx
import Link from "next/link"

const DIFFICULTIES = [
  { d: "1", label: "基本", bg: "bg-green-50 text-green-700 hover:bg-green-100" },
  { d: "2", label: "標準", bg: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { d: "3", label: "難問", bg: "bg-red-50 text-red-700 hover:bg-red-100" },
]

const SC_CATEGORIES = [
  { key: "ai_threat",  label: "AI脅威対策",         icon: "🤖" },
  { key: "threat",     label: "脅威・攻撃手法",      icon: "⚠️" },
  { key: "coding",     label: "セキュアコーディング", icon: "💻" },
  { key: "crypto",     label: "暗号・PKI",           icon: "🔑" },
  { key: "management", label: "セキュリティ管理",     icon: "📋" },
]

const AIF_CATEGORIES = [
  { key: "bedrock",        label: "Amazon Bedrock", icon: "🪨" },
  { key: "responsible_ai", label: "責任あるAI",      icon: "⚖️" },
  { key: "ml_basics",      label: "ML基礎",          icon: "📐" },
  { key: "generative_ai",  label: "生成AI概念",      icon: "✨" },
  { key: "sdk",            label: "AWSサービス",     icon: "☁️" },
]

export default function HomePage() {
  return (
    <main>

      {/* ① ヒーロー — 象徴・理念 */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6 tracking-tight">
            <span className="text-sky-400">支援士（SC）</span>と<br />
            <span className="text-orange-400">AWS AIF</span>を<br />
            <span className="text-white">同時に合格する</span>
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base leading-relaxed mb-10">
            AI時代に必要なのは、知識ではなく<strong className="text-white">判断力</strong>。<br />
            守る設計力と、AIを使いこなす力を、ここで同時に鍛える。
          </p>
          <Link href="/common/exam?module=MIXED"
            className="inline-block border border-amber-400/40 text-amber-200 font-bold px-6 py-2.5 rounded-xl hover:bg-amber-500/10 transition-colors text-sm">
            SC × AIF シナジー模擬試験 →
          </Link>
        </div>
      </section>

      {/* ② サポート — 理念の補足 */}
      <section className="py-16 px-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 leading-snug text-center">
            覚えるだけでは、足りない。
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-loose text-center mb-12">
            AIが知識を代替する時代、問われるのは<br />
            「何を使うか」「どう守るか」を自分で判断できる力だ。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="border border-sky-100 bg-sky-50 rounded-2xl p-6">
              <p className="text-[11px] font-bold text-sky-500 mb-3 tracking-wide uppercase">SC 情報処理安全確保支援士</p>
              <p className="text-xl font-black text-gray-900 mb-2">リスクを見抜き、守る力</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                脅威の構造を理解し、設計・コード・運用の各層でセキュリティを判断できる実務力。
              </p>
            </div>
            <div className="border border-orange-100 bg-orange-50 rounded-2xl p-6">
              <p className="text-[11px] font-bold text-orange-500 mb-3 tracking-wide uppercase">AIF AWS Certified AI Practitioner</p>
              <p className="text-xl font-black text-gray-900 mb-2">AIを実務で使いこなす力</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                生成AIの可能性と限界を把握し、クラウド上でAIを正しく選択・設計できる判断力。
              </p>
            </div>
          </div>

          <div className="border border-indigo-100 bg-indigo-50 rounded-2xl px-7 py-5 text-center">
            <p className="text-gray-700 text-sm leading-relaxed">
              <span className="font-black text-indigo-700">Certi-AI Hub</span> は、AI・セキュリティ・クラウドを横断して<br className="hidden sm:inline" />
              実務で使える判断力を鍛えるための学習プラットフォームです。
            </p>
          </div>
        </div>
      </section>

      {/* ③ ディテール — SC カテゴリ */}
      <section className="py-10 px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-sky-700 border border-sky-200 px-3 py-1 rounded-full">
              🔒 SC 情報処理安全確保支援士
            </span>
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-300">
              <span className="text-green-600 font-medium">基本</span>
              <span className="text-gray-200">/</span>
              <span className="text-amber-600 font-medium">標準</span>
              <span className="text-gray-200">/</span>
              <span className="text-red-500 font-medium">難問</span>
              <span className="ml-1">で絞れます</span>
            </span>
          </div>
          <Link href="/common/exam?module=SC&mode=exam"
            className="text-xs font-bold text-sky-700 border border-sky-200 px-4 py-1.5 rounded-xl hover:bg-sky-50 transition-colors shrink-0">
            SC模擬試験 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SC_CATEGORIES.map(c => (
            <div key={c.key} className="border border-gray-100 hover:border-sky-200 rounded-xl p-4 transition-colors group">
              <Link href={`/common/exam?module=SC&category=${c.key}`} className="block mb-3">
                <span className="text-xl block mb-2">{c.icon}</span>
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-sky-700 transition-colors leading-tight">{c.label}</h3>
              </Link>
              <div className="flex gap-1 flex-wrap border-t border-gray-50 pt-2">
                {DIFFICULTIES.map(({ d, label, bg }) => (
                  <Link key={d} href={`/common/exam?module=SC&category=${c.key}&difficulty=${d}`}
                    className={`text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${bg}`}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ③ ディテール — AIF カテゴリ */}
      <section className="py-10 px-4 max-w-5xl mx-auto border-t border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-bold text-orange-700 border border-orange-200 px-3 py-1 rounded-full">
            ☁️ AIF AWS Certified AI Practitioner
          </span>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="text-xs font-bold text-orange-700 border border-orange-200 px-4 py-1.5 rounded-xl hover:bg-orange-50 transition-colors shrink-0">
            AIF模擬試験 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {AIF_CATEGORIES.map(c => (
            <div key={c.key} className="border border-gray-100 hover:border-orange-200 rounded-xl p-4 transition-colors group">
              <Link href={`/common/exam?module=AIF&category=${c.key}`} className="block mb-3">
                <span className="text-xl block mb-2">{c.icon}</span>
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-orange-700 transition-colors leading-tight">{c.label}</h3>
              </Link>
              <div className="flex gap-1 flex-wrap border-t border-gray-50 pt-2">
                {DIFFICULTIES.map(({ d, label, bg }) => (
                  <Link key={d} href={`/common/exam?module=AIF&category=${c.key}&difficulty=${d}`}
                    className={`text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${bg}`}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ③ ディテール — ツール */}
      <section className="py-8 px-4 max-w-5xl mx-auto border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: "/synergy",         label: "SC×AIFシナジーマップ" },
            { href: "/dashboard",       label: "ダッシュボード" },
            { href: "/common/calendar", label: "試験日カレンダー" },
            { href: "/sc-module",       label: "Interactive Lab" },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="border border-gray-100 hover:border-indigo-200 hover:text-indigo-700 rounded-xl px-4 py-3 text-center text-xs font-bold text-gray-500 transition-colors">
              {t.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ④ CTA — 行動喚起 */}
      <section className="py-20 px-4 text-center border-t border-gray-100">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
          判断力は、問題を解くことで鍛えられる。
        </h2>
        <p className="text-gray-400 text-sm mb-10">無料プランで今日からすぐ始められます</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/common/exam?module=SC&mode=exam"
            className="bg-indigo-700 hover:bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl transition-colors text-sm">
            SC模擬試験を始める
          </Link>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="border-2 border-indigo-700 text-indigo-700 hover:bg-indigo-50 font-black px-10 py-4 rounded-2xl transition-colors text-sm">
            AIF模擬試験を始める
          </Link>
        </div>
      </section>

    </main>
  )
}
