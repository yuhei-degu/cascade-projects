"use client"
// src/components/exam/ResultPanel.tsx
// 採点結果・解説・AIヒント・シナジーリンク表示

import { useState } from "react"
import { CheckCircle, XCircle, Lightbulb, Link2, Loader2 } from "lucide-react"
import type { Question, HintResponse } from "@/types"

interface Props {
  question: Question
  userAnswer: string
  onNext: () => void
  isLast?: boolean
}

export function ResultPanel({ question, userAnswer, onNext, isLast }: Props) {
  const isCorrect = userAnswer === question.answer
  const [hint, setHint] = useState<HintResponse | null>(null)
  const [loadingHint, setLoadingHint] = useState(false)

  async function fetchHint() {
    setLoadingHint(true)
    const res = await fetch("/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: question.id,
        question: question.question,
        user_answer: userAnswer,
      }),
    })
    const data = await res.json()
    if (data.data) setHint(data.data)
    setLoadingHint(false)
  }

  return (
    <div className="space-y-4 mt-4">
      {/* 正誤バナー */}
      <div className={`flex items-center gap-3 p-4 rounded-xl font-bold text-lg
        ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        {isCorrect
          ? <><CheckCircle size={24} /> 正解！ 素晴らしい！</>
          : <><XCircle size={24} /> 不正解。正解は <strong className="mx-1">{question.answer}</strong> でした</>
        }
      </div>

      {/* 解説 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-600 mb-2">📖 解説</p>
        <p className="text-sm text-blue-800 leading-relaxed">{question.explanation}</p>
      </div>

      {/* AIヒント */}
      {!hint ? (
        <button
          onClick={fetchHint}
          disabled={loadingHint}
          className="flex items-center gap-2 text-sm text-violet-600 font-semibold hover:underline"
        >
          {loadingHint
            ? <><Loader2 size={14} className="animate-spin" /> AIヒント取得中...</>
            : <><Lightbulb size={14} /> 🤖 AIにさらに詳しく聞く</>
          }
        </button>
      ) : (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-xs font-bold text-violet-600 mb-1">🤖 AIアドバイス — {hint.concept}</p>
          <p className="text-sm text-violet-800 leading-relaxed">{hint.hint}</p>
          {hint.synergy && (
            <div className="mt-3 flex items-start gap-2">
              <Link2 size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-600">{hint.synergy}</p>
            </div>
          )}
        </div>
      )}

      {/* シナジーヒント（問題に付属している場合） */}
      {question.synergy_hint && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
          <Link2 size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700"><strong>シナジー学習：</strong>{question.synergy_hint}</p>
        </div>
      )}

      {/* 次へ */}
      <button
        onClick={onNext}
        className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors"
      >
        {isLast ? "🎉 試験を終了する" : "次の問題へ →"}
      </button>
    </div>
  )
}
