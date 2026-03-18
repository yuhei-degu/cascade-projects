"use client"
// src/app/(public)/common/exam/page.tsx
import { useReducer, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { examReducer, initialExamState, calcScore, isPassing } from "@/lib/exam/engine"
import type { ExamMode } from "@/lib/exam/engine"
import { QuestionCard } from "@/components/exam/QuestionCard"
import { ResultPanel }  from "@/components/exam/ResultPanel"
import { ExamTimer }    from "@/components/exam/ExamTimer"
import type { Question } from "@/types"

const DIFFICULTY_LABEL: Record<string, string> = {
  "1": "⭐ 必須問題", "2": "⭐⭐ 標準問題", "3": "⭐⭐⭐ 難問",
}

function ExamContent() {
  const params     = useSearchParams()
  const module     = (params.get("module") ?? "SC") as "SC" | "AIF" | "MIXED"
  const category   = params.get("category") ?? undefined
  const difficulty = params.get("difficulty") ?? undefined
  const mode       = (params.get("mode") ?? "study") as ExamMode
  const limit      = mode === "exam" ? 20 : 10
  const [state, dispatch] = useReducer(examReducer, initialExamState)

  useEffect(() => {
    // URLパラメータが変わったら即ローディング状態にリセット
    dispatch({ type: "RESET" })
    async function init() {
      const qs = new URLSearchParams({ module, limit: String(limit), shuffle: "true" })
      if (category)   qs.set("category", category)
      if (difficulty) qs.set("difficulty", difficulty)
      const qRes  = await fetch(`/api/questions?${qs}`)
      const qData = await qRes.json()
      if (!qData.data?.length) return
      const mockSession = {
        id: crypto.randomUUID(), user_id: "guest", module,
        status: "active" as const, started_at: new Date().toISOString(),
        time_limit: 180, question_ids: qData.data.map((q: Question) => q.id),
        answers: {}, score: 0, total: qData.data.length, finished_at: undefined,
      }
      dispatch({ type: "SET_SESSION", session: mockSession, questions: qData.data, mode })
    }
    init()
  }, [module, category, difficulty, mode, limit])

  const handleAnswer = useCallback(async (answer: string) => {
    const q = state.questions[state.currentIdx]
    if (!q || !state.session) return
    let is_correct = answer.toUpperCase() === q.answer.toUpperCase()
    try {
      const res = await fetch(`/api/exam/${state.session.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: q.id, answer, time_spent: 30 }),
      })
      if (res.ok) { const d = await res.json(); is_correct = d.data?.is_correct ?? is_correct }
    } catch { /* ゲスト時はローカル採点 */ }
    dispatch({ type: "ANSWER", questionId: q.id, answer, correct: is_correct })
  }, [state.questions, state.currentIdx, state.session])

  if (state.phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">📝</div>
        <p className="text-gray-500 font-medium">問題を読み込み中...</p>
      </div>
    </div>
  )

  if (state.phase === "finished") {
    const { correct, total, pct } = calcScore(state.results)
    const passing    = isPassing(pct)
    const wrongCount = Object.values(state.results).filter(v => !v).length
    const modeLabel  = difficulty ? DIFFICULTY_LABEL[difficulty] : category ? `#${category}` : (mode === "exam" ? "模擬試験" : "全問")
    const retryUrl   = `/common/exam?module=${module}${category ? `&category=${category}` : ""}${difficulty ? `&difficulty=${difficulty}` : ""}&mode=${mode}`
    const backUrl    = module === "AIF" ? "/aws-module" : "/sc-module"

    // localStorageに記録（ゲストモード）
    if (typeof window !== "undefined") {
      try {
        const prev = JSON.parse(localStorage.getItem("certi_sessions") ?? "[]")
        prev.push({
          date: new Date().toLocaleDateString("ja-JP"),
          module, correct, total, pct, mode,
        })
        localStorage.setItem("certi_sessions", JSON.stringify(prev.slice(-50)))
      } catch { /* ignore */ }
    }
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-6">
            <div className="text-6xl mb-3">{passing ? "🎉" : "💪"}</div>
            <p className="text-xs font-bold text-gray-400 mb-1">{modeLabel}</p>
            <h1 className="text-2xl font-black mb-2">{passing ? "合格ライン達成！" : "もう少し！"}</h1>
            <p className="text-gray-500 mb-4">{correct} / {total} 問正解</p>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full transition-all duration-1000 ${passing ? "bg-green-500" : "bg-amber-400"}`}
                style={{ width: `${pct}%` }} />
            </div>
            <p className={`text-3xl font-black mb-1 ${passing ? "text-green-600" : "text-amber-600"}`}>{pct}%</p>
            <p className="text-xs text-gray-400 mb-6">合格ライン: 70%</p>
            {wrongCount > 0 && (
              <button onClick={() => dispatch({ type: "RETRY_WRONGS" })}
                className="w-full mb-3 bg-red-50 text-red-600 border-2 border-red-200 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors">
                🔁 間違えた {wrongCount} 問を復習する（学習モード）
              </button>
            )}
            <div className="flex gap-3">
              <a href={retryUrl} className="flex-1 bg-brand text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm">もう一度</a>
              <a href={backUrl} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">戻る</a>
            </div>
          </div>
          {mode === "exam" && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-700">📖 解説一覧</h2>
              {state.questions.map((q, i) => {
                const userAns = state.answers[q.id]
                const isCorrect = state.results[q.id]
                const isTimeout = userAns === "__timeout__"
                return (
                  <div key={q.id} className={`bg-white rounded-2xl border-2 p-5 ${isCorrect ? "border-green-200" : "border-red-200"}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`text-lg shrink-0 ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                        {isCorrect ? "✅" : "❌"}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Q{i + 1} · {q.category} · 難易度{q.difficulty}</p>
                        <p className="font-medium text-gray-800 text-sm leading-relaxed">{q.question}</p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-1 text-xs">
                      <p className={`font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        あなたの回答: {isTimeout ? "⏱ タイムアップ" : (userAns ?? "未回答")}
                        {!isCorrect && !isTimeout && <span className="text-gray-500 ml-2">→ 正解: {q.answer}</span>}
                      </p>
                      <p className="text-gray-600 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const current  = state.questions[state.currentIdx]
  if (!current) return null
  const answered = state.answers[current.id]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${(state.currentIdx / state.questions.length) * 100}%` }} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === "exam" && (
              <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full">📋 模擬試験</span>
            )}
            {difficulty && (
              <span className="text-xs font-bold bg-indigo-50 text-brand px-2 py-1 rounded-full">{DIFFICULTY_LABEL[difficulty]}</span>
            )}
            <span className="text-sm font-bold text-gray-500">{state.currentIdx + 1} / {state.questions.length}</span>
          </div>
          <ExamTimer key={state.currentIdx} timeLimitSeconds={180}
            onTimeUp={() => dispatch({ type: "TIME_UP" })} paused={state.phase === "reviewing"} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <QuestionCard key={current.id} question={current}
          questionNumber={state.currentIdx + 1} total={state.questions.length}
          onAnswer={handleAnswer} disabled={state.phase === "reviewing"} />
        {state.mode === "study" && state.phase === "reviewing" && answered && (
          <ResultPanel question={current} userAnswer={answered}
            onNext={() => dispatch({ type: "NEXT" })}
            isLast={state.currentIdx === state.questions.length - 1} />
        )}
      </div>
    </div>
  )
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📝</div>
          <p className="text-gray-500 font-medium">読み込み中...</p>
        </div>
      </div>
    }>
      <ExamContent />
    </Suspense>
  )
}
