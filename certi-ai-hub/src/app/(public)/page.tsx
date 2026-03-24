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

      {/* ① ヒーロー — 左テキスト・右ビジュアル */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white min-h-[520px] flex items-center px-4 py-16">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* 左：テキスト */}
          <div>
            <p className="text-indigo-400 text-sm font-bold tracking-widest mb-4 uppercase">
              Certi-AI Hub
            </p>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6 tracking-tight">
              支援士（SC）と<br />
              AWS AIFを<br />
              <span className="text-indigo-400">同時に合格する</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              AI時代、判断力こそが究極のスキル。<br />
              知識の暗記ではなく、セキュリティ設計力と<br />
              クラウドAI活用力を、ここで同時に鍛える。
            </p>
            <Link href="/common/exam?module=MIXED"
              className="inline-block bg-white text-slate-900 font-black px-7 py-3 rounded-xl hover:bg-indigo-100 transition-colors text-sm">
              SC × AIF シナジー模擬試験
            </Link>
          </div>

          {/* 右：ビジュアル */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-80 h-80">
              {/* 中央のメインアイコン */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-sky-500/20 border border-indigo-400/30 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🛡️</div>
                    <div className="text-indigo-300 text-xs font-bold tracking-widest">AI × SECURITY</div>
                  </div>
                </div>
              </div>
              {/* 周囲のアイコン群 */}
              {[
                { icon: "🔒", top: "4%",  left: "40%",  bg: "from-sky-500/20 to-sky-500/10" },
                { icon: "☁️", top: "20%", left: "78%",  bg: "from-orange-500/20 to-orange-500/10" },
                { icon: "🤖", top: "68%", left: "75%",  bg: "from-violet-500/20 to-violet-500/10" },
                { icon: "🔑", top: "75%", left: "20%",  bg: "from-amber-500/20 to-amber-500/10" },
                { icon: "⚡", top: "18%", left: "4%",   bg: "from-green-500/20 to-green-500/10" },
              ].map((item, i) => (
                <div key={i}
                  className={`absolute w-12 h-12 rounded-2xl bg-gradient-to-br ${item.bg} border border-white/10 flex items-center justify-center text-xl backdrop-blur-sm`}
                  style={{ top: item.top, left: item.left }}>
                  {item.icon}
                </div>
              ))}
              {/* 接続線（装飾） */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 320 320">
                <line x1="160" y1="160" x2="160" y2="20"  stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4"/>
                <line x1="160" y1="160" x2="290" y2="80"  stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4"/>
                <line x1="160" y1="160" x2="270" y2="240" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4"/>
                <line x1="160" y1="160" x2="80"  y2="260" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4"/>
                <line x1="160" y1="160" x2="50"  y2="80"  stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4"/>
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* ② SC / AIF 対比カード */}
      <section className="bg-slate-900 px-4 pb-16 pt-2">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-7 hover:border-sky-500/40 transition-colors">
            <p className="text-sky-400 text-xs font-bold tracking-widest mb-3 uppercase">SC 情報処理安全確保支援士</p>
            <p className="text-white text-xl font-black mb-2">リスクを見抜き、守る力</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              脅威の構造を理解し、設計・コード・運用の各層でセキュリティを判断できる実務力を鍛える。
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-7 hover:border-orange-500/40 transition-colors">
            <p className="text-orange-400 text-xs font-bold tracking-widest mb-3 uppercase">AIF AWS Certified AI Practitioner</p>
            <p className="text-white text-xl font-black mb-2">AIを実務で使いこなす力</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              生成AIの可能性と限界を把握し、クラウド上でAIを正しく選択・設計できる判断力を鍛える。
            </p>
          </div>
        </div>
      </section>

      {/* ③ プラットフォーム説明 — 1行 */}
      <section className="bg-slate-900 border-t border-slate-800 px-4 py-10 text-center">
        <p className="text-slate-400 text-sm sm:text-base">
          <span className="text-white font-black">Certi-AI Hub</span> は、AI・セキュリティ・クラウドを横断して、実務で使える判断力を鍛えるための学習プラットフォームです。
        </p>
      </section>

      {/* ④ SC カテゴリ */}
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

      {/* ④ AIF カテゴリ */}
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

      {/* ⑤ ツール */}
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

      {/* ⑥ CTA */}
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
