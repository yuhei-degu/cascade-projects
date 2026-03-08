"use client"
// src/app/(public)/prompts/page.tsx

import { useState } from "react"
import { PROMPT_TEMPLATES } from "@/lib/utils/prompt-templates"
import { Copy, Check } from "lucide-react"

export default function PromptsPage() {
  const [selected, setSelected] = useState(PROMPT_TEMPLATES[0])
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(selected.template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🚀</div>
        <h1 className="text-3xl font-black mb-3">プロンプト生成器</h1>
        <p className="text-gray-500">作りたいものを選ぶだけで、Claude Codeへの指示文を自動生成します</p>
      </div>

      {/* テンプレート選択 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {PROMPT_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              selected.id === t.id
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-violet-300"
            }`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="font-bold text-sm">{t.label}</div>
            <div className="text-xs text-gray-500 mt-1">{t.description}</div>
          </button>
        ))}
      </div>

      {/* 生成されたプロンプト */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <span className="text-gray-400 text-sm font-semibold">
            {selected.icon} {selected.label} — Claude Codeに貼り付けるプロンプト
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? <><Check size={13} /> コピー済み</> : <><Copy size={13} /> コピー</>}
          </button>
        </div>
        <pre className="p-5 text-green-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
          {selected.template}
        </pre>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>📋 使い方:</strong> 上のプロンプトをコピー → Claude Codeの黒い画面に貼り付けて実行
      </div>
    </main>
  )
}
