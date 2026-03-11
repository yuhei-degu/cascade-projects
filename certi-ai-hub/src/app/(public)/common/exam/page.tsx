"use client"
// src/app/(public)/common/exam/page.tsx — TASK-017
import { useReducer, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { examReducer, initialExamState, calcScore, isPassing } from "@/lib/exam/engine"
import { QuestionCard } from "@/components/exam/QuestionCard"
import { ResultPanel }  from "@/components/exam/ResultPanel"
import { ExamTimer }    from "@/components/exam/ExamTimer"
import type { Question } from "@/types"

export default function ExamPage() {
  const params  = useSearchParams()
  const module  = (params.get("module") ?? "SC") as "SC" | "AIF" | "MIXED"
  const category = params.get("category") ?? undefined

  const [state, dispatch] = useReducer(examReducer, initialExamState)

  // 問題取得 & セッション作成
  useEffect(() => {
    async function init() {
      const qRes = await fetch(
        `/api/questions?module=${module}&limit=10&shuffle=true${category ? `&category=${category}` : ""}`,
      )
      const qData = await qRes.json()
      if (!qData.data?.length) return

      // セッション作成（未ログイン時はモック）
      const mockSession = {
        id: crypto.randomUUID(), user_id: "guest", module,
        status: "active" as const, started_at: new Date().toISOString(),
        time_limit: 1800, question_ids: qData.data.map((q: Question) => q.id),
        answers: {}, score: 0, total: qData.data.length, finished_at: undefined,
      }
      dispatch({ type: "SET_SESSION", session: mockSession, questions: qData.data })
    }
    init()
  }, [module, category])

  const handleAnswer = useCallback(async (answer: string) => {
    const q = state.questions[state.currentIdx]
    if (!q || !state.session) return

    let is_correct = answer.toUpperCase() === q.answer.toUpperCase()

    // ログイン済みならAPIに送信
    try {
      const res = await fetch(`/api/exam/${state.session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: q.id, answer, time_spent: 30 }),
      })
      if (res.ok) { const d = await res.json(); is_correct = d.data?.is_correct ?? is_correct }
    } catch { /* ゲスト時はローカル採点 */ }

    dispatch({ type: "ANSWER", questionId: q.id, answer, correct: is_correct })
  }, [state.questions, state.currentIdx, state.session])

  // ─── ローディング ────────────────────────────────────────
  if (state.phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">📝</div>
        <p className="text-gray-500 font-medium">問題を読み込み中...</p>
      </div>
    </div>
  )

  // ─── 試験完了画面 ─────────────────────────────────────────
  if (state.phase === "finished") {
    const { correct, total, pct } = calcScore(state.results)
    const passing = isPassing(pct)
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{passing ? "🎉" : "💪"}</div>
          <h1 className="text-2xl font-black mb-2">{passing ? "合格ライン達成！" : "もう少し！"}</h1>
          <p className="text-gray-500 mb-6">{correct} / {total} 問正解</p>
          <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className={`h-full rounded-full transition-all duration-1000 ${passing ? "bg-green-500" : "bg-amber-400"}`}
              style={{ width: `${pct}%` }} />
          </div>
          <p className={`text-3xl font-black mb-8 ${passing ? "text-green-600" : "text-amber-600"}`}>{pct}%</p>
          <p className="text-sm text-gray-400 mb-6">合格ライン: 70%</p>
          <div className="flex gap-3">
            <a href={`/common/exam?module=${module}`}
              className="flex-1 bg-brand text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
              もう一度
            </a>
            <a href={module === "SC" ? "/sc-module" : "/aws-module"}
              className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
              戻る
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ─── 試験中画面 ───────────────────────────────────────────
  const current = state.questions[state.currentIdx]
  if (!current) return null
  const answered = state.answers[current.id]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 上部バー */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${((state.currentIdx) / state.questions.length) * 100}%` }} />
          </div>
          <span className="text-sm font-bold text-gray-500 shrink-0">
            {state.currentIdx + 1} / {state.questions.length}
          </span>
          <ExamTimer
            timeLimitSeconds={state.session?.time_limit ?? 1800}
            onTimeUp={() => dispatch({ type: "TIME_UP" })}
            paused={state.phase === "reviewing"}
          />
        </div>
      </div>

      {/* 問題エリア */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <QuestionCard
          question={current}
          questionNumber={state.currentIdx + 1}
          total={state.questions.length}
          onAnswer={handleAnswer}
          disabled={state.phase === "reviewing"}
        />
        {state.phase === "reviewing" && answered && (
          <ResultPanel
            question={current}
            userAnswer={answered}
            onNext={() => dispatch({ type: "NEXT" })}
            isLast={state.currentIdx === state.questions.length - 1}
          />
        )}
      </div>
    </div>
  )
}
