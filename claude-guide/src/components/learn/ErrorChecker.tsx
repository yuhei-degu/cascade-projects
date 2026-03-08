"use client"
// src/components/learn/ErrorChecker.tsx
// エラー貼り付け → 自動診断UI

import { useState } from "react"
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react"

export function ErrorChecker() {
  const [errorText, setErrorText] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleCheck() {
    if (!errorText.trim()) return
    setLoading(true); setResult(null)
    const res = await fetch("/api/ai/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errorText }),
    })
    const data = await res.json()
    setResult(data.analysis)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-orange-500" />
        <h2 className="font-bold text-lg">エラー診断ツール</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        エラーメッセージをそのままコピーして貼り付けると、原因と解決方法を教えます。
      </p>

      <textarea
        value={errorText}
        onChange={(e) => setErrorText(e.target.value)}
        placeholder={"例:\n'node' は内部コマンドまたは外部コマンドとして認識されていません。"}
        className="w-full border border-gray-200 rounded-xl p-4 text-sm font-mono h-28 resize-none focus:outline-none focus:border-violet-400 mb-3"
      />

      <button
        onClick={handleCheck}
        disabled={loading || !errorText.trim()}
        className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> 診断中...</> : "🔍 診断する"}
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-semibold text-amber-800 text-sm mb-1">🔎 原因</p>
            <p className="text-amber-700 text-sm">{result.cause}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-800 text-sm mb-2">✅ 解決手順</p>
            <ol className="space-y-2">
              {result.steps.map((s: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-green-700">
                  <span className="font-bold text-green-500">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {result.guideUrl && (
            <a
              href={result.guideUrl}
              className="flex items-center gap-2 text-violet-600 hover:underline text-sm font-semibold"
            >
              <CheckCircle size={16} /> 詳しい手順ガイドを見る →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
