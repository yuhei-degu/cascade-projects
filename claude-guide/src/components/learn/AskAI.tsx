"use client"
// src/components/learn/AskAI.tsx
// 「AIに聞く」ボタン + モーダル

import { useState } from "react"
import { Bot, X, Send, Loader2 } from "lucide-react"

interface Props {
  stepId?: string
  defaultQuestion?: string
}

export function AskAI({ stepId, defaultQuestion = "" }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState(defaultQuestion)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAsk() {
    if (!question.trim()) return
    setLoading(true); setError(""); setAnswer("")
    try {
      const res = await fetch("/api/ai/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, stepId }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setAnswer(data.answer)
    } catch {
      setError("通信エラーが発生しました。ページを再読み込みしてお試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
      >
        <Bot size={16} /> 🤖 AIに聞く
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-violet-600" />
                <h3 className="font-bold text-lg">AIに質問する</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-500 mb-3">どこで困っていますか？気軽に聞いてください！</p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例：node --version を入力したらエラーが出ました"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-violet-400"
              />

              {answer && (
                <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
              )}
              {error && (
                <p className="mt-3 text-red-500 text-sm">{error}</p>
              )}
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold"
              >
                閉じる
              </button>
              <button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? "回答中..." : "質問する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
