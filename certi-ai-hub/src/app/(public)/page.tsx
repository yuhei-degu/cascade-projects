// src/app/(public)/page.tsx
import Link from "next/link"

const DIFFICULTIES = [
  { d: "1", label: "基本", bg: "bg-green-50 text-green-700 hover:bg-green-100" },
  { d: "2", label: "標準", bg: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { d: "3", label: "難問", bg: "bg-red-50 text-red-700 hover:bg-red-100" },
]

const SC_CATEGORIES = [
  { key: "ai_threat",  label: "AI脅威対策",         icon: "🤖", desc: "プロンプトインジェクション・データポイズニング" },
  { key: "threat",     label: "脅威・攻撃手法",      icon: "⚠️", desc: "XSS・SQLi・CSRF・フィッシング" },
  { key: "coding",     label: "セキュアコーディング", icon: "💻", desc: "脆弱性特定・セキュアな実装パターン" },
  { key: "crypto",     label: "暗号・PKI",           icon: "🔑", desc: "公開鍵暗号・電子署名・TLS・証明書" },
  { key: "management", label: "セキュリティ管理",     icon: "📋", desc: "ISMS・インシデント対応・法規制" },
]

const AIF_CATEGORIES = [
  { key: "bedrock",        label: "Amazon Bedrock", icon: "🪨", desc: "Guardrails・Agents・Knowledge Bases" },
  { key: "responsible_ai", label: "責任あるAI",      icon: "⚖️", desc: "公平性・説明可能性・プライバシー" },
  { key: "ml_basics",      label: "ML基礎",          icon: "📐", desc: "教師あり/なし・評価指標・過学習" },
  { key: "generative_ai",  label: "生成AI概念",      icon: "✨", desc: "RAG・プロンプト・ファインチューニング" },
  { key: "sdk",            label: "AWSサービス",     icon: "☁️", desc: "Textract・Comprehend・SageMaker" },
]

export default function HomePage() {
  return (
    <main>

      {/* ━━━ ヒーロー ━━━ */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white pt-14 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-xs px-4 py-1.5 rounded-full mb-7 tracking-wide">
            ✨ 2026年度CBT方式対応 — SC × AIF 統合プラットフォーム
          </div>

          {/* メインコピー */}
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-5">
            <span className="text-sky-400">支援士（SC）</span>と{" "}
            <span className="text-orange-400">AWS AIF</span>を<br />
            <span className="text-white">同時に合格する</span>
          </h1>

          {/* サブコピー — 理念を一言で */}
          <p className="text-indigo-200 text-sm sm:text-base leading-relaxed mb-9">
            AI時代に必要なのは、知識ではなく<span className="text-white font-bold">判断力</span>。<br className="hidden sm:inline" />
            守る設計力と、AIを使いこなす力を、ここで同時に鍛える。
          </p>

          <Link href="/common/exam?module=MIXED"
            className="inline-flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
            🔗 SC × AIF シナジー模擬試験
          </Link>
        </div>
      </section>

      {/* ━━━ 理念セクション ━━━ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* キャッチライン */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-snug tracking-tight">
              覚えるだけでは、足りない。
            </h2>
            <p className="text-gray-500 text-sm sm:text-[15px] leading-loose max-w-lg mx-auto">
              AIが知識を代替する時代、問われるのは<br className="hidden sm:inline" />
              「何を使うか」「どう守るか」「どう設計するか」を<br className="hidden sm:inline" />
              自分で判断できる力だ。
            </p>
          </div>

          {/* SC / AIF 対比カード */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* SC */}
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔒</span>
                <span className="text-[11px] font-bold text-sky-600 bg-sky-100 px-2.5 py-1 rounded-full tracking-wide">
                  SC 情報処理安全確保支援士
                </span>
              </div>
              <p className="text-xl font-black text-gray-800 mb-2">リスクを見抜き、守る力</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                脅威の構造を理解し、設計・コード・運用の各層で<br />
                セキュリティを判断できる実務力。
              </p>
            </div>

            {/* AIF */}
            <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">☁️</span>
                <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full tracking-wide">
                  AIF AWS Certified AI Practitioner
                </span>
              </div>
              <p className="text-xl font-black text-gray-800 mb-2">AIを実務で使いこなす力</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                生成AIの可能性と限界を把握し、クラウド上で<br />
                AIを正しく選択・設計・活用できる判断力。
              </p>
            </div>
          </div>

          {/* プラットフォームの立ち位置 */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-sky-50 border border-indigo-100 px-8 py-6 text-center">
            <p className="text-gray-700 text-sm sm:text-[15px] leading-relaxed">
              <span className="font-black text-indigo-700">Certi-AI Hub</span> は、AI・セキュリティ・クラウドを横断して、<br className="hidden sm:inline" />
              実務で使える判断力を鍛えるための学習プラットフォームです。
            </p>
          </div>

        </div>
      </section>

      {/* ━━━ SC カテゴリ ━━━ */}
      <section className="py-10 px-4 max-w-5xl mx-auto border-t border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="bg-sky-100 text-sky-700 text-xs font-bold px-3 py-1 rounded-full">
              🔒 SC 情報処理安全確保支援士
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300">
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">基本</span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium">標準</span>
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-medium">難問</span>
              で難易度を選べます
            </span>
          </div>
          <Link href="/common/exam?module=SC&mode=exam"
            className="text-xs font-bold bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-500 transition-colors shrink-0">
            📋 SC模擬試験
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SC_CATEGORIES.map(c => (
            <div key={c.key} className="bg-white border-2 border-gray-100 hover:border-sky-200 hover:shadow-md rounded-2xl p-4 transition-all group">
              <Link href={`/common/exam?module=SC&category=${c.key}`} className="block mb-3">
                <span className="text-2xl block mb-2">{c.icon}</span>
                <h3 className="font-bold text-sm text-gray-800 mb-1 group-hover:text-sky-700 transition-colors leading-tight">{c.label}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
              </Link>
              <div className="flex gap-1.5 flex-wrap border-t border-gray-50 pt-2.5">
                {DIFFICULTIES.map(({ d, label, bg }) => (
                  <Link key={d} href={`/common/exam?module=SC&category=${c.key}&difficulty=${d}`}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${bg}`}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ AIF カテゴリ ━━━ */}
      <section className="py-10 px-4 max-w-5xl mx-auto border-t border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
              ☁️ AIF AWS Certified AI Practitioner
            </span>
          </div>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="text-xs font-bold bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-500 transition-colors shrink-0">
            📋 AIF模擬試験
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AIF_CATEGORIES.map(c => (
            <div key={c.key} className="bg-white border-2 border-gray-100 hover:border-orange-200 hover:shadow-md rounded-2xl p-4 transition-all group">
              <Link href={`/common/exam?module=AIF&category=${c.key}`} className="block mb-3">
                <span className="text-2xl block mb-2">{c.icon}</span>
                <h3 className="font-bold text-sm text-gray-800 mb-1 group-hover:text-orange-700 transition-colors leading-tight">{c.label}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
              </Link>
              <div className="flex gap-1.5 flex-wrap border-t border-gray-50 pt-2.5">
                {DIFFICULTIES.map(({ d, label, bg }) => (
                  <Link key={d} href={`/common/exam?module=AIF&category=${c.key}&difficulty=${d}`}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${bg}`}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ ツールリンク ━━━ */}
      <section className="py-8 px-4 max-w-5xl mx-auto border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/synergy",         icon: "🔗", label: "SC×AIFシナジーマップ", color: "hover:border-amber-300" },
            { href: "/dashboard",       icon: "📊", label: "ダッシュボード",        color: "hover:border-indigo-300" },
            { href: "/common/calendar", icon: "📅", label: "試験日カレンダー",      color: "hover:border-violet-300" },
            { href: "/sc-module",       icon: "💻", label: "Interactive Lab",       color: "hover:border-red-300" },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className={`bg-white border-2 border-gray-100 ${t.color} rounded-2xl p-4 text-center hover:shadow-md transition-all`}>
              <span className="text-2xl block mb-1">{t.icon}</span>
              <span className="text-xs font-bold text-gray-600">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="py-16 px-4 text-center bg-gray-50 border-t border-gray-100">
        <p className="text-xs font-bold text-indigo-500 tracking-widest mb-3 uppercase">Start Learning</p>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
          判断力は、問題を解くことで鍛えられる。
        </h2>
        <p className="text-gray-400 text-sm mb-8">模擬試験・カテゴリ別学習・シナジーマップがすべて無料</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/common/exam?module=SC&mode=exam"
            className="bg-sky-600 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-sky-500 transition-colors shadow-lg text-sm">
            📋 SC模擬試験を始める
          </Link>
          <Link href="/common/exam?module=AIF&mode=exam"
            className="bg-orange-600 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-orange-500 transition-colors shadow-lg text-sm">
            📋 AIF模擬試験を始める
          </Link>
        </div>
      </section>

    </main>
  )
}
