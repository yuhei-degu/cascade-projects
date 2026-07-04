import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Code2,
  Gauge,
  Layers,
  Lock,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const difficulties = [
  { d: "1", label: "基礎", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { d: "2", label: "標準", tone: "text-amber-700 bg-amber-50 border-amber-200" },
  { d: "3", label: "難問", tone: "text-rose-700 bg-rose-50 border-rose-200" },
]

const scCategories = [
  { key: "ai_threat", label: "AI脅威対策", icon: Brain, desc: "プロンプトインジェクション、データ汚染、モデル攻撃" },
  { key: "threat", label: "脅威と攻撃手法", icon: ShieldAlert, desc: "SQLi、XSS、CSRF、マルウェア、フィッシング" },
  { key: "coding", label: "セキュアコーディング", icon: Code2, desc: "安全な実装、入力検証、脆弱性修正" },
  { key: "crypto", label: "暗号・PKI", icon: Lock, desc: "公開鍵暗号、電子署名、TLS、証明書" },
  { key: "management", label: "セキュリティ管理", icon: ShieldCheck, desc: "ISMS、リスク管理、法制度、インシデント対応" },
]

const aifCategories = [
  { key: "bedrock", label: "Amazon Bedrock", icon: Cloud, desc: "Guardrails、Agents、Knowledge Bases、モデル選定" },
  { key: "responsible_ai", label: "Responsible AI", icon: ShieldCheck, desc: "公平性、透明性、プライバシー、安全性" },
  { key: "ml_basics", label: "ML基礎", icon: Brain, desc: "学習、推論、評価、データの考え方" },
  { key: "generative_ai", label: "生成AI概念", icon: Sparkles, desc: "RAG、埋め込み、トークン、ファインチューニング" },
  { key: "sdk", label: "AWS AIサービス", icon: Layers, desc: "Textract、Comprehend、Rekognition、KMS" },
]

function CategoryGrid({
  module,
  categories,
  accent,
}: {
  module: "SC" | "AIF"
  categories: typeof scCategories
  accent: "sky" | "orange"
}) {
  const focusClass = accent === "sky" ? "focus:ring-sky-300" : "focus:ring-orange-300"

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <article key={category.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
            <Link href={`/common/exam?module=${module}&category=${category.key}`} className={`block rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusClass}`}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-950">{category.label}</h3>
              <p className="mt-2 min-h-12 text-xs leading-5 text-slate-500">{category.desc}</p>
            </Link>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {difficulties.map((difficulty) => (
                <Link
                  key={difficulty.d}
                  href={`/common/exam?module=${module}&category=${category.key}&difficulty=${difficulty.d}`}
                  className={`rounded-md border px-2 py-1 text-xs font-bold transition hover:bg-white ${difficulty.tone}`}
                >
                  {difficulty.label}
                </Link>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              <Sparkles size={14} />
              SC と AWS AIF を横断して学ぶ
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
              AI時代のセキュリティとクラウドAIを、試験対策から実務感覚まで。
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Certi-AI Hub は、情報処理安全確保支援士のセキュリティ知識と AWS Certified AI Practitioner のAI基礎を一緒に鍛える学習ハブです。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/common/exam?module=MIXED" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <PlayCircle size={18} />
                混合10問を始める
              </Link>
              <Link href="/common/exam?module=SC&mode=exam" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                SC模擬試験
                <ArrowRight size={16} />
              </Link>
              <Link href="/common/exam?module=AIF&mode=exam" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200">
                AIF模擬試験
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-7 grid max-w-2xl grid-cols-3 gap-2 text-center">
              {[
                ["10問", "短時間学習"],
                ["20問", "模擬試験"],
                ["復習", "弱点の見直し"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="text-lg font-black text-slate-900">{value}</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
            <Image src="/ai-cube-cyber.png" alt="AI学習ハブのビジュアル" fill className="object-cover opacity-90" priority />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-white/10 bg-white/10 p-3 text-white backdrop-blur">
                  <div className="flex items-center gap-2 font-bold"><ShieldCheck size={16} /> SC</div>
                  <p className="mt-1 text-xs text-slate-300">脅威、暗号、設計、運用</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/10 p-3 text-white backdrop-blur">
                  <div className="flex items-center gap-2 font-bold"><Cloud size={16} /> AIF</div>
                  <p className="mt-1 text-xs text-slate-300">生成AI、AWS、責任あるAI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { href: "/dashboard", icon: Gauge, title: "学習ダッシュボード", body: "累計回答数、平均正答率、復習候補を確認します。" },
            { href: "/synergy", icon: Layers, title: "SC × AIF 連携", body: "セキュリティ概念とAWS AI機能の対応を見ます。" },
            { href: "/common/calendar", icon: CalendarDays, title: "試験日カレンダー", body: "受験日から逆算して学習ペースを整えます。" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Security</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">情報処理安全確保支援士</h2>
            <p className="mt-2 text-sm text-slate-500">脅威、設計、実装、運用をカテゴリ別に学習できます。</p>
          </div>
          <Link href="/sc-module" className="inline-flex items-center gap-1 text-sm font-bold text-sky-700 hover:text-sky-900">
            SCモジュールへ <ArrowRight size={15} />
          </Link>
        </div>
        <CategoryGrid module="SC" categories={scCategories} accent="sky" />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Cloud AI</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">AWS Certified AI Practitioner</h2>
            <p className="mt-2 text-sm text-slate-500">生成AI、責任あるAI、AWSサービスを試験形式で確認できます。</p>
          </div>
          <Link href="/aws-module" className="inline-flex items-center gap-1 text-sm font-bold text-orange-700 hover:text-orange-900">
            AIFモジュールへ <ArrowRight size={15} />
          </Link>
        </div>
        <CategoryGrid module="AIF" categories={aifCategories} accent="orange" />
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">今日の最短ルート</h2>
            <p className="mt-1 text-sm text-slate-500">迷ったら混合10問で現在地を確認し、間違えた分野を復習しましょう。</p>
          </div>
          <Link href="/common/exam?module=MIXED&shuffle=true" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800">
            <CheckCircle2 size={17} />
            現在地チェック
          </Link>
        </div>
      </section>
    </main>
  )
}
