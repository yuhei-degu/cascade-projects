"use client"
// src/components/exam/QuestionCard.tsx
import { useState } from "react"
import { Lightbulb, ChevronUp } from "lucide-react"
import type { Question } from "@/types"

interface Props {
  question: Question
  questionNumber: number
  total: number
  onAnswer: (value: string) => void
  disabled?: boolean
}

const MODULE_COLOR = {
  SC:  "bg-sky-100 text-sky-700 border-sky-200",
  AIF: "bg-orange-100 text-orange-700 border-orange-200",
}
const DIFFICULTY_LABEL = ["", "基本", "標準", "応用"]

export function QuestionCard({ question, questionNumber, total, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [written, setWritten]   = useState("")
  const [hintOpen, setHintOpen] = useState(false)
  const isMultipleChoice = !!question.options && question.options.length > 0

  function handleSelect(key: string) {
    if (disabled || selected) return
    setSelected(key); onAnswer(key)
  }
  function handleSubmitWritten() {
    if (disabled || selected || !written.trim()) return
    setSelected("__written__"); onAnswer(written)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${MODULE_COLOR[question.module]}`}>
            {question.module === "SC" ? "情報処理安全確保支援士" : "AWS AI Practitioner"}
          </span>
          <span className="text-xs text-gray-400">{question.category}</span>
          <span className="text-xs text-gray-400">難易度: {DIFFICULTY_LABEL[question.difficulty]}</span>
        </div>
        <span className="text-sm font-semibold text-gray-500 shrink-0">{questionNumber} / {total}</span>
      </div>
      {/* 問題文 */}
      <p className="text-gray-800 leading-relaxed mb-4 font-medium">{question.question}</p>
      {/* コードスニペット */}
      {question.code_snippet && (
        <pre className="bg-gray-900 text-green-400 text-sm rounded-xl p-4 mb-4 overflow-x-auto">
          <code>{question.code_snippet}</code>
        </pre>
      )}
      {/* ヒントボタン — 常に表示・API呼び出しなし */}
      {!disabled && (
        <div className="mb-4">
          <button onClick={() => setHintOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
            {hintOpen ? <><ChevronUp size={13} />ヒントを隠す</> : <><Lightbulb size={13} />💡 ヒントを見る</>}
          </button>
          {hintOpen && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 leading-relaxed">
              {question.hint ?? "このカテゴリのヒントは準備中です。解説は回答後に表示されます。"}
            </div>
          )}
        </div>
      )}
      {/* 択一選択肢 */}
      {isMultipleChoice ? (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <button key={opt.key} onClick={() => handleSelect(opt.key)}
              disabled={disabled || !!selected}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm
                ${selected === opt.key ? "border-brand bg-indigo-50 font-semibold" : "border-gray-200 hover:border-brand/50 hover:bg-gray-50"}
                ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              <span className="font-bold text-gray-500 mr-3">{opt.key}.</span>{opt.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea
            className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="あなたの回答を記述してください"
            disabled={disabled || !!selected}
            value={written} onChange={e => !selected && setWritten(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">記述式問題です。キーワードや考え方を日本語でまとめてください。</p>
            <button type="button" onClick={handleSubmitWritten}
              disabled={disabled || !!selected || !written.trim()}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors
                ${disabled || !!selected || !written.trim() ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-brand text-white hover:bg-brand-dark cursor-pointer"}`}>
              回答を送信
            </button>
          </div>
        </div>
      )}
      {/* タグ */}
      <div className="flex flex-wrap gap-1 mt-4">
        {question.tags.map(tag => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
        ))}
      </div>
    </div>
  )
}
