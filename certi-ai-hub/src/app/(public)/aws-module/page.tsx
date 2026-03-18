// src/app/(public)/aws-module/page.tsx
import Link from "next/link"
import { Cloud, ShieldAlert, Cpu, GitBranch, Layers } from "lucide-react"

const CATEGORIES = [
  { key: "bedrock",        label: "Amazon Bedrock",   icon: Cloud,       color: "orange", desc: "Guardrails・Agents・Knowledge Bases・モデル選定" },
  { key: "sagemaker",      label: "SageMaker",        icon: Cpu,         color: "yellow", desc: "学習・推論・MLOps・パイプライン・エンドポイント" },
  { key: "responsible_ai", label: "責任あるAI",        icon: ShieldAlert, color: "red",    desc: "公平性・透明性・プライバシー・安全性・堅牢性" },
  { key: "sdk",            label: "AWS AIサービス",    icon: GitBranch,   color: "teal",   desc: "Textract・Comprehend・Rekognition・KMS・CloudTrail" },
  { key: "generative_ai",  label: "生成AI概念",        icon: Layers,      color: "violet", desc: "RAG・ファインチューニング・トークン・埋め込み" },
]

const COLORMAP: Record<string, string> = {
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  red:    "bg-red-50 border-red-200 text-red-700",
  teal:   "bg-teal-50 border-teal-200 text-teal-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
}

const DIFFICULTIES = [
  { value: "",  label: "全問題",   icon: "📚", desc: "難易度まぜこぜ10問" },
  { value: "1", label: "必須問題", icon: "⭐",  desc: "基本・頻出問題" },
  { value: "2", label: "標準問題", icon: "⭐⭐", desc: "本試験レベル" },
  { value: "3", label: "難問",     icon: "⭐⭐⭐", desc: "応用・難問のみ" },
]

export default function AwsModulePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          ☁️ AWS Certified AI Practitioner（AIF）
        </div>
        <h1 className="text-3xl font-black mb-3">AWS AIF 学習モジュール</h1>
        <p className="text-gray-500">Bedrock・SageMaker・Responsible AI を体系的に学習。最新SDK連携まで網羅。</p>
      </div>

      {/* 模擬試験バナー */}
      <div className="bg-gradient-to-r from-orange-900 to-amber-800 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
        <div>
          <p className="text-orange-300 text-sm font-bold mb-1">📋 AIF模擬試験</p>
          <h2 className="text-xl font-black mb-2">AIF CBTシミュレーター</h2>
          <p className="text-orange-200 text-sm">20問・解説なし・全問終了後に結果＆解説</p>
        </div>
        <Link href="/common/exam?module=AIF&mode=exam"
          className="bg-white text-orange-900 font-black px-5 py-3 rounded-xl hover:bg-orange-50 transition-colors shrink-0">
          開始 →
        </Link>
      </div>

      {/* 難易度別スタート */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">難易度で選ぶ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DIFFICULTIES.map(d => (
            <Link key={d.value}
              href={`/common/exam?module=AIF${d.value ? `&difficulty=${d.value}` : ""}`}
              className="flex flex-col items-center gap-1 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-orange-400 hover:shadow-md transition-all text-center">
              <span className="text-2xl">{d.icon}</span>
              <span className="font-bold text-sm text-gray-800">{d.label}</span>
              <span className="text-xs text-gray-400">{d.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* カテゴリ × 難易度 */}
      <h2 className="text-lg font-bold mb-3">カテゴリで選ぶ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <div key={c.key} className={`p-5 rounded-2xl border-2 ${COLORMAP[c.color]}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={20} />
                <h3 className="font-bold">{c.label}</h3>
              </div>
              <p className="text-xs opacity-70 mb-3 leading-relaxed">{c.desc}</p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/common/exam?module=AIF&category=${c.key}`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  📚 全問
                </Link>
                <Link href={`/common/exam?module=AIF&category=${c.key}&difficulty=1`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  ⭐ 必須
                </Link>
                <Link href={`/common/exam?module=AIF&category=${c.key}&difficulty=2`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  ⭐⭐ 標準
                </Link>
                <Link href={`/common/exam?module=AIF&category=${c.key}&difficulty=3`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  ⭐⭐⭐ 難問
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* シナジーバナー */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center">
        <div className="text-3xl">🔗</div>
        <div>
          <p className="font-bold text-amber-800 mb-1">シナジー学習 — AWS × SC</p>
          <p className="text-sm text-amber-700">AWSで実装するガードレール機能が、SC試験のどの脅威対策に対応するか相互確認できます。</p>
        </div>
        <Link href="/common/exam?module=MIXED"
          className="ml-auto bg-amber-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-amber-600 shrink-0 text-sm">
          両方解く
        </Link>
      </div>
    </main>
  )
}
