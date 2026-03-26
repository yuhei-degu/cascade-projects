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

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Text */}
          <div>
            <p className="text-gray-400 text-sm font-semibold tracking-[0.2em] mb-4 uppercase">
              Certi-AI Hub
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6 text-white text-glow">
              SYNCHRONIZED<br />
              CERTIFICATION
            </h1>
            <h2 className="text-lg sm:text-xl font-medium text-slate-300 mb-6 leading-snug max-w-lg">
              Master RISS and AWS AI Practitioner Together.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-md font-medium">
              In the Age of AI, judgement is the ultimate skill. Master security and cloud architecture, not just knowledge.
            </p>
            <Link href="/common/exam?module=MIXED"
              className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md font-bold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              Access Synergy Mock Exam
            </Link>
          </div>

          {/* Right Visual Image */}
          <div className="flex items-center justify-center relative">
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
      <section className="px-4 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SC Card */}
          <Link href="/sc-module" className="block group bg-gradient-to-br from-sky-50 to-white text-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-sky-200">
            <h3 className="text-2xl font-black mb-4 group-hover:text-sky-600 transition-colors">RISS: Security Strategy</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Build resilient architecture to predict, defend, and secure code.
            </p>
          </Link>

          {/* AIF Card */}
          <Link href="/aws-module" className="block group bg-gradient-to-br from-orange-50 to-white text-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-orange-200">
            <h3 className="text-2xl font-black mb-4 group-hover:text-orange-600 transition-colors">AWS AIF: AI Command</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Apply generative AI with precision for powerful real-world impact.
            </p>
          </Link>

        </div>
      </section>

      {/* 3. Main Navigation & Categories Segment (Light Area) */}
      <div className="bg-white text-slate-900 rounded-t-[3rem] pt-16 pb-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative z-20">
        
        {/* Core Message */}
        <div className="max-w-4xl mx-auto text-center px-4 mb-14">
          <p className="text-base sm:text-lg font-bold text-slate-800 tracking-wide leading-relaxed">
            <span className="text-indigo-600 font-black">Certi-AI Hub</span> は、AI・セキュリティ・クラウドを横断して<br className="hidden sm:block" />実戦で使える判断力を鍛えるための学習プラットフォームです。
          </p>
          <div className="flex justify-center items-center gap-6 mt-8 font-bold text-sm">
            <Link href="/common/exam?module=SC&mode=exam" className="text-slate-700 hover:text-indigo-600 transition-colors">
              RISS Mock Exam <span className="text-indigo-500 ml-1">✧</span>
            </Link>
            <Link href="/common/exam?module=AIF&mode=exam" className="text-slate-700 hover:text-indigo-600 transition-colors">
              AWS AIF Mock Exam <span className="text-indigo-500 ml-1">✧</span>
            </Link>
          </div>
        </div>

        {/* 4. Categorized Problems (SC & AIF) */}
        <div className="max-w-6xl mx-auto space-y-16 px-4">
          
          {/* SC 領域 */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4 border-l-4 border-sky-500 pl-3">
                <span className="text-lg font-black text-slate-800">
                  🔒 情報処理安全確保支援士 (SC)
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                難易度で絞る：
                <span className="text-green-600 flex items-center gap-1">🟢 基本</span> /
                <span className="text-amber-600 flex items-center gap-1">🟡 標準</span> /
                <span className="text-red-600 flex items-center gap-1">🔴 難問</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SC_CATEGORIES.map(c => (
                <div key={c.key} className="bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-2xl p-4 transition-all hover:shadow-md group">
                  <Link href={`/common/exam?module=SC&category=${c.key}`} className="block mb-4">
                    <span className="text-2xl block mb-2">{c.icon}</span>
                    <h3 className="font-bold text-sm text-slate-800 group-hover:text-sky-700 transition-colors">{c.label}</h3>
                  </Link>
                  <div className="flex gap-1.5 flex-wrap border-t border-slate-200 pt-3">
                    {DIFFICULTIES.map(({ d, label, bg }) => (
                      <Link key={d} href={`/common/exam?module=SC&category=${c.key}&difficulty=${d}`}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded transition-transform hover:scale-105 ${bg}`}>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4 border-l-4 border-orange-500 pl-3">
                <span className="text-lg font-black text-slate-800">
                  ☁️ AWS Certified AI Practitioner (AIF)
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                難易度で絞る：
                <span className="text-green-600">🟢 基本</span> /
                <span className="text-amber-600">🟡 標準</span> /
                <span className="text-red-600">🔴 難問</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {AIF_CATEGORIES.map(c => (
                <div key={c.key} className="bg-slate-50 border border-slate-200 hover:border-orange-300 rounded-2xl p-4 transition-all hover:shadow-md group">
                  <Link href={`/common/exam?module=AIF&category=${c.key}`} className="block mb-4">
                    <span className="text-2xl block mb-2">{c.icon}</span>
                    <h3 className="font-bold text-sm text-slate-800 group-hover:text-orange-700 transition-colors">{c.label}</h3>
                  </Link>
                  <div className="flex gap-1.5 flex-wrap border-t border-slate-200 pt-3">
                    {DIFFICULTIES.map(({ d, label, bg }) => (
                      <Link key={d} href={`/common/exam?module=AIF&category=${c.key}&difficulty=${d}`}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded transition-transform hover:scale-105 ${bg}`}>
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
        <div className="max-w-5xl mx-auto mt-20 px-4">
          <h4 className="text-sm font-bold text-slate-400 text-center mb-6 tracking-widest uppercase">Useful Tools</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/synergy",         label: "SC×AIF シナジー" },
              { href: "/dashboard",       label: "ダッシュボード" },
              { href: "/common/calendar", label: "試験日カレンダー" },
              { href: "/sc-module",       label: "Interactive Lab" },
            ].map(t => (
              <Link key={t.href} href={t.href}
                className="bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 rounded-xl px-4 py-3 text-center text-xs font-bold text-slate-600 transition-all hover:bg-indigo-50/50">
                {t.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
