// src/app/(public)/aws-module/page.tsx — TASK-016
import Link from "next/link"
import { Cloud, ShieldAlert, Cpu, GitBranch, Layers } from "lucide-react"

const CATEGORIES = [
  { key: "bedrock",        label: "Amazon Bedrock",   icon: Cloud,       color: "orange", desc: "Guardrails・Agents・Knowledge Bases・モデル選択", count: 14 },
  { key: "sagemaker",      label: "SageMaker",        icon: Cpu,         color: "yellow", desc: "学習・推論・MLOps・パイプライン・エンドポイント", count: 10 },
  { key: "responsible_ai", label: "責任あるAI",        icon: ShieldAlert, color: "red",    desc: "公平性・透明性・プライバシー・安全性・堅牢性", count: 12 },
  { key: "sdk",            label: "AWS SDK連携",       icon: GitBranch,   color: "teal",   desc: "Boto3・Lambda統合・IAMロール・API Gateway連携", count: 8 },
  { key: "usecase",        label: "GenAIユースケース",  icon: Layers,      color: "violet", desc: "RAG・チャットBot・コード生成・要約・分類タスク", count: 11 },
]

const COLORMAP: Record<string, string> = {
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  red:    "bg-red-50 border-red-200 text-red-700",
  teal:   "bg-teal-50 border-teal-200 text-teal-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
}

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
          <p className="text-orange-200 text-sm">65問・130分制限・本番形式</p>
        </div>
        <Link href="/common/exam?module=AIF"
          className="bg-white text-orange-900 font-black px-5 py-3 rounded-xl hover:bg-orange-50 transition-colors shrink-0">
          開始 →
        </Link>
      </div>

      {/* カテゴリ */}
      <h2 className="text-lg font-bold mb-4">カテゴリ別学習</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <Link key={c.key} href={`/common/exam?module=AIF&category=${c.key}`}
              className={`group p-5 rounded-2xl border-2 ${COLORMAP[c.color]} hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={24} />
                <span className="text-xs font-bold opacity-60">{c.count}問</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{c.label}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{c.desc}</p>
            </Link>
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
