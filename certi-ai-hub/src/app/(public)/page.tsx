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
    <main className="bg-slate-950 min-h-screen text-slate-100 font-sans">
      
      {/* 1. Hero Section (Mockup Inspired) */}
      <section className="relative px-4 pt-16 pb-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-900/30 via-slate-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          
          {/* Left Text */}
          <div className="order-2 lg:order-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold tracking-[0.2em] mb-6 uppercase shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> AIセキュリティエンジニア養成所
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter mb-6 text-white drop-shadow-xl">
              資格で終わらない、<br />
              <span className="text-indigo-400">AI時代に通用する</span><br />
              実務力を。
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl font-medium mb-4 leading-snug max-w-lg tracking-tight">
              セキスペ（SC）・AWS AIFを同時に対策。
            </p>
            <p className="text-slate-400/90 text-sm sm:text-base leading-relaxed mb-10 max-w-md font-medium">
              資格に合格するだけでなく、実際のAI駆動開発で<br />
              役立つセキュリティ設計力・クラウドAI活用力を鍛える。
            </p>
            <Link href="/common/exam?module=MIXED"
              className="group relative inline-flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] focus:outline-none focus:ring-4 focus:ring-indigo-500/50">
              <span className="tracking-wide">SC × AIF シナジー模擬試験</span>
            </Link>
          </div>

          {/* Right Visual Image */}
          <div className="flex items-center justify-center relative order-1 lg:order-2">
             <div className="relative w-full max-w-xs sm:max-w-md aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-white/10 bg-slate-900/50 backdrop-blur-xl">
               <Image 
                 src="/ai-cube-cyber.png" 
                 alt="Cyber AI Cube"
                 fill
                 className="object-cover mix-blend-lighten"
                 priority
               />
             </div>
          </div>
        </div>
      </section>

      {/* 2. Concept Cards (Mockup Inspired) */}
      <section className="px-4 pb-24 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* SC Card */}
          <Link href="/sc-module" className="block group relative bg-white/5 backdrop-blur-sm border border-white/10 text-slate-300 rounded-[2.5rem] p-10 sm:p-12 transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:border-sky-400/30 hover:shadow-[0_20px_50px_rgba(14,165,233,0.15)] focus:outline-none focus:ring-4 focus:ring-sky-500/30 overflow-hidden">
            <h3 className="text-2xl lg:text-3xl font-black mb-5 text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-300 group-hover:to-white transition-all">SC：リスクを見抜き、守る力</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              脅威の構造を理解し、設計・コード・運用の各層でセキュリティを判断できる実務力。
            </p>
          </Link>

          {/* AIF Card */}
          <Link href="/aws-module" className="block group relative bg-white/5 backdrop-blur-sm border border-white/10 text-slate-300 rounded-[2.5rem] p-10 sm:p-12 transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:border-orange-400/30 hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] focus:outline-none focus:ring-4 focus:ring-orange-500/30 overflow-hidden">
            <h3 className="text-2xl lg:text-3xl font-black mb-5 text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-300 group-hover:to-white transition-all">AIF：AIを実務で使いこなす力</h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              生成AIの可能性と限界を把握し、クラウド上でAIを正しく選択・設計できる判断力。
            </p>
          </Link>

        </div>
      </section>

      {/* 3. Main Navigation & Categories Segment (Light Area) */}
      <div className="bg-slate-50 text-slate-900 rounded-t-[3rem] lg:rounded-t-[4rem] px-4 pt-20 pb-24 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative z-20">
        
        {/* Core Message */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-lg sm:text-xl font-bold text-slate-700 tracking-wide leading-loose">
          <span className="text-indigo-600 font-black">AIセキュリティエンジニア養成所</span> は、AI・セキュリティ・クラウドを<br className="hidden sm:block" />横断して実戦で使える判断力を鍛えるための学習プラットフォームです。
          </p>
          <div className="flex justify-center items-center gap-6 mt-10 font-bold text-sm">
            <Link href="/common/exam?module=SC&mode=exam" className="text-slate-500 hover:text-indigo-600 border-b border-transparent hover:border-indigo-600 transition-all pb-0.5">
              SC 模擬試験
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/common/exam?module=AIF&mode=exam" className="text-slate-500 hover:text-indigo-600 border-b border-transparent hover:border-indigo-600 transition-all pb-0.5">
              AIF 模擬試験
            </Link>
          </div>
        </div>

        {/* 4. Categorized Problems (SC & AIF) */}
        <div className="max-w-6xl mx-auto space-y-16 px-4">
          
          {/* SC 領域 */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4 pl-1">
                <span className="text-xl font-black text-slate-800 tracking-tight">
                  🔒 情報処理安全確保支援士 <span className="text-slate-400 font-semibold">(SC)</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-semibold bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200/60">
                難易度で絞る：
                <span className="text-sky-600 flex items-center gap-1">🟢 基本</span> /
                <span className="text-sky-700 flex items-center gap-1">🟡 標準</span> /
                <span className="text-sky-900 flex items-center gap-1">🔴 難問</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {SC_CATEGORIES.map(c => (
                <div key={c.key} className="bg-white border border-slate-200/80 hover:border-sky-300 rounded-[1.5rem] p-5 transition-all hover:shadow-[0_10px_30px_rgba(14,165,233,0.1)] hover:-translate-y-1 group relative">
                  <Link href={`/common/exam?module=SC&category=${c.key}`} className="block mb-5">
                    <span className="text-3xl block mb-3 opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-sm">{c.icon}</span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-700 group-hover:text-sky-600 transition-colors">{c.label}</h3>
                  </Link>
                  <div className="flex gap-2 flex-wrap border-t border-slate-100 pt-4">
                    {DIFFICULTIES.map(({ d, label }) => (
                      <Link key={d} href={`/common/exam?module=SC&category=${c.key}&difficulty=${d}`}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all border border-slate-100 text-slate-500 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus:ring-2 focus:ring-sky-200`}>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4 pl-1">
                <span className="text-xl font-black text-slate-800 tracking-tight">
                  ☁️ AWS Certified AI Practitioner <span className="text-slate-400 font-semibold">(AIF)</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-semibold bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200/60">
                難易度で絞る：
                <span className="text-orange-500">🟢 基本</span> /
                <span className="text-orange-600">🟡 標準</span> /
                <span className="text-orange-700">🔴 難問</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {AIF_CATEGORIES.map(c => (
                <div key={c.key} className="bg-white border border-slate-200/80 hover:border-orange-300 rounded-[1.5rem] p-5 transition-all hover:shadow-[0_10px_30px_rgba(249,115,22,0.1)] hover:-translate-y-1 group relative">
                  <Link href={`/common/exam?module=AIF&category=${c.key}`} className="block mb-5">
                    <span className="text-3xl block mb-3 opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-sm">{c.icon}</span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-700 group-hover:text-orange-600 transition-colors">{c.label}</h3>
                  </Link>
                  <div className="flex gap-2 flex-wrap border-t border-slate-100 pt-4">
                    {DIFFICULTIES.map(({ d, label }) => (
                      <Link key={d} href={`/common/exam?module=AIF&category=${c.key}&difficulty=${d}`}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all border border-slate-100 text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus:ring-2 focus:ring-orange-200`}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* 5. Useful Tools */}
        <div className="max-w-6xl mx-auto mt-24">
          <h4 className="text-xs font-bold text-slate-400 text-center mb-8 tracking-[0.2em] uppercase">Useful Tools</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: "/synergy",         label: "SC×AIF シナジー", icon: "🔗" },
              { href: "/dashboard",       label: "ダッシュボード", icon: "📊" },
              { href: "/common/calendar", label: "試験日カレンダー", icon: "📅" },
              { href: "/sc-module",       label: "Interactive Lab", icon: "🧪" },
            ].map(t => (
              <Link key={t.href} href={t.href}
                className="bg-white border border-slate-200/60 hover:border-indigo-300 hover:text-indigo-700 rounded-2xl p-4 text-center font-bold text-slate-600 transition-all hover:-translate-y-1 hover:shadow-lg focus:ring-2 focus:ring-indigo-200 flex flex-col items-center gap-2">
                <span className="text-2xl drop-shadow-sm">{t.icon}</span>
                <span className="text-xs">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
