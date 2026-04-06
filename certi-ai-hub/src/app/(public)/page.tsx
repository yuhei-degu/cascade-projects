import Link from "next/link"
import Image from "next/image"

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
    <main className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* 1. ヒーローセクション */}
      <section className="relative px-4 pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-900/20 via-slate-900/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          
          {/* 左側テキスト */}
          <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold tracking-[0.2em] mb-8 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> AIセキュリティエンジニア養成所
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6 text-white text-balance">
              資格で終わらない、<br />
              <span className="text-indigo-400">AI時代に通用する</span><br />
              実務力を。
            </h1>
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-medium mb-4 leading-snug">
              セキスペ（SC）・AWS AIFを同時に対策。
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-md font-medium text-balance">
              資格に合格するだけでなく、実際のAI駆動開発で役立つセキュリティ設計力・クラウドAI活用力を鍛える。
            </p>
            <Link href="/common/exam?module=MIXED"
              className="group relative inline-flex items-center justify-center bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 w-full sm:w-auto">
              <span className="tracking-wide">SC × AIF シナジー模擬試験</span>
            </Link>
          </div>

          {/* 右側ビジュアル */}
          <div className="flex items-center justify-center relative order-1 lg:order-2">
             <div className="relative w-full max-w-xs sm:max-w-md aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 bg-slate-900/50 backdrop-blur-sm">
               <Image 
                 src="/ai-cube-cyber.png" 
                 alt="AIサイバーキューブ"
                 fill
                 className="object-cover mix-blend-lighten"
                 priority
               />
             </div>
          </div>
        </div>
      </section>

      {/* 2. コンセプトカード */}
      <section className="px-4 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          <Link href="/sc-module" className="group flex flex-col justify-center bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:bg-slate-900 hover:border-sky-500/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white tracking-tight group-hover:text-sky-400 transition-colors">SC：リスクを見抜き、守る力</h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed flex-1">
              脅威の構造を理解し、設計・コード・運用の各層でセキュリティを判断できる実務力。
            </p>
          </Link>

          <Link href="/aws-module" className="group flex flex-col justify-center bg-slate-900/50 backdrop-blur-sm border border-slate-800 text-slate-300 rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:bg-slate-900 hover:border-orange-500/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white tracking-tight group-hover:text-orange-400 transition-colors">AIF：AIを実務で使いこなす力</h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed flex-1">
              生成AIの可能性と限界を把握し、クラウド上でAIを正しく選択・設計できる判断力。
            </p>
          </Link>

        </div>
      </section>

      {/* 3. メインカテゴリ一覧（ライト背景） */}
      <div className="bg-slate-50 text-slate-900 rounded-t-[2.5rem] sm:rounded-t-[3.5rem] px-4 pt-20 pb-24 relative z-20 border-t border-slate-200/50">
        
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <p className="text-base sm:text-lg font-bold text-slate-700 tracking-wide leading-loose">
            <span className="text-indigo-600 font-extrabold">AIセキュリティエンジニア養成所</span>は、AI・セキュリティ・クラウドを<br className="hidden sm:block" />横断して実戦で使える判断力を鍛えるためのプラットフォームです。
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-8 font-bold text-sm">
            <Link href="/common/exam?module=SC&mode=exam" className="text-slate-500 hover:text-indigo-600 border-b border-transparent hover:border-indigo-600 transition-colors py-1">
              SC 模擬試験
            </Link>
            <span className="hidden sm:inline text-slate-300">/</span>
            <Link href="/common/exam?module=AIF&mode=exam" className="text-slate-500 hover:text-indigo-600 border-b border-transparent hover:border-indigo-600 transition-colors py-1">
              AIF 模擬試験
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-20 px-0 sm:px-4">
          
          {/* SC 領域 */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-2 sm:px-0">
              <span className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                情報処理安全確保支援士 <span className="text-sky-600 font-bold ml-1">SC</span>
              </span>
              <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 text-xs text-slate-500 font-medium bg-white px-4 py-2 sm:py-2.5 rounded-full shadow-sm border border-slate-200">
                <span className="hidden sm:inline">難易度目安：</span>
                <span className="text-green-600">🟢 基本</span>
                <span className="text-amber-600">🟡 標準</span>
                <span className="text-red-600">🔴 難問</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {SC_CATEGORIES.map(c => (
                <div key={c.key} className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:shadow-sm group flex flex-col">
                  <Link href={`/common/exam?module=SC&category=${c.key}`} className="block flex-1 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 rounded-xl">
                    <span className="text-2xl sm:text-3xl block mb-3 opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-sm">{c.icon}</span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-sky-600 transition-colors leading-tight">{c.label}</h3>
                  </Link>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap border-t border-slate-100 pt-3 sm:pt-4 mt-auto">
                    {DIFFICULTIES.map(({ d, label, bg }) => (
                      <Link key={d} href={`/common/exam?module=SC&category=${c.key}&difficulty=${d}`}
                        className={`text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg border border-transparent ${bg} transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200`}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AIF 領域 */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 px-2 sm:px-0">
              <span className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                AWS Certified AI Practitioner <span className="text-orange-600 font-bold ml-1">AIF</span>
              </span>
              <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 text-xs text-slate-500 font-medium bg-white px-4 py-2 sm:py-2.5 rounded-full shadow-sm border border-slate-200">
                <span className="hidden sm:inline">難易度目安：</span>
                <span className="text-green-600">🟢 基本</span>
                <span className="text-amber-600">🟡 標準</span>
                <span className="text-red-600">🔴 難問</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {AIF_CATEGORIES.map(c => (
                <div key={c.key} className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:shadow-sm group flex flex-col">
                  <Link href={`/common/exam?module=AIF&category=${c.key}`} className="block flex-1 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-xl">
                    <span className="text-2xl sm:text-3xl block mb-3 opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-sm">{c.icon}</span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-orange-600 transition-colors leading-tight">{c.label}</h3>
                  </Link>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap border-t border-slate-100 pt-3 sm:pt-4 mt-auto">
                    {DIFFICULTIES.map(({ d, label, bg }) => (
                      <Link key={d} href={`/common/exam?module=AIF&category=${c.key}&difficulty=${d}`}
                        className={`text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg border border-transparent ${bg} transition-colors focus:outline-none focus:ring-2 focus:ring-orange-200`}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* お役立ちツール */}
        <div className="max-w-4xl mx-auto mt-20 sm:mt-24 px-2 sm:px-0">
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 text-center mb-8 tracking-[0.2em] uppercase">
            お役立ちツール
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { href: "/synergy",         label: "SC×AIF シナジー", icon: "🔗" },
              { href: "/dashboard",       label: "ダッシュボード",   icon: "📊" },
              { href: "/common/calendar", label: "試験日カレンダー", icon: "📅" },
              { href: "/sc-module",       label: "インタラクティブラボ", icon: "🧪" },
            ].map(t => (
              <Link key={t.href} href={t.href}
                className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 rounded-2xl p-4 sm:p-5 text-center font-bold text-slate-700 transition-all duration-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 flex flex-col items-center justify-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl drop-shadow-sm">{t.icon}</span>
                <span className="text-xs sm:text-sm leading-tight">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
