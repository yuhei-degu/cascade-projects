"use client"
// src/app/(public)/common/exam/page.tsx
import { useReducer, useEffect, useCallback, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { examReducer, initialExamState, calcScore, isPassing, summarizeStudyProgress } from "@/lib/exam/engine"
import type { ExamMode, LocalStudySessionRecord } from "@/lib/exam/engine"
import { QuestionCard } from "@/components/exam/QuestionCard"
import { ResultPanel }  from "@/components/exam/ResultPanel"
import { ExamTimer }    from "@/components/exam/ExamTimer"
import Link from "next/link"
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
  const [history, setHistory] = useState<LocalStudySessionRecord[]>([])
  const savedSessionKey = useRef<string | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("certi_sessions") ?? "[]")
      if (Array.isArray(stored)) setHistory(stored)
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    savedSessionKey.current = null
    dispatch({ type: "RESET" })
    async function init() {
      try {
        const qs = new URLSearchParams({ module, limit: String(limit), shuffle: "true" })
        if (category)   qs.set("category", category)
        if (difficulty) qs.set("difficulty", difficulty)
        const qRes = await fetch(`/api/questions?${qs}`)

        if (qRes.status === 403) {
          dispatch({ type: "LIMIT_REACHED" })
          return
        }

        if (!qRes.ok) {
          dispatch({ type: "SET_ERROR", message: "問題の取得に失敗しました。時間をおいて再度お試しください。" })
          return
        }

        const qData = await qRes.json()
        if (!qData.data?.length) {
          dispatch({ type: "SET_EMPTY" })
          return
        }
        const mockSession = {
          id: crypto.randomUUID(), user_id: "guest", module,
          status: "active" as const, started_at: new Date().toISOString(),
          time_limit: 180, question_ids: qData.data.map((q: Question) => q.id),
          answers: {}, score: 0, total: qData.data.length, finished_at: undefined,
        }
        dispatch({ type: "SET_SESSION", session: mockSession, questions: qData.data, mode })
      } catch {
        dispatch({ type: "SET_ERROR", message: "ネットワークまたは一時的な問題で読み込めませんでした。" })
      }
    }
    init()
  }, [module, category, difficulty, mode, limit])

  useEffect(() => {
    if (state.phase !== "finished" || !state.session) return
    const { correct, total, pct } = calcScore(state.results)
    if (total === 0) return

    const sessionKey = `${state.session.id}:${correct}:${total}:${pct}:${mode}`
    if (savedSessionKey.current === sessionKey) return
    savedSessionKey.current = sessionKey

    const finishedAt = new Date()
    const record: LocalStudySessionRecord = {
      date: finishedAt.toLocaleDateString("ja-JP"),
      module,
      correct,
      total,
      pct,
      mode,
      category,
      difficulty,
      finishedAt: finishedAt.toISOString(),
      durationSeconds: Math.max(0, Math.round((Date.now() - state.startedAt) / 1000)),
    }

    try {
      const prev = JSON.parse(localStorage.getItem("certi_sessions") ?? "[]")
      const next = [...(Array.isArray(prev) ? prev : []), record].slice(-50)
      localStorage.setItem("certi_sessions", JSON.stringify(next))
      setHistory(next)
    } catch {
      setHistory((prev) => [...prev, record].slice(-50))
    }
  }, [state.phase, state.session, state.results, state.startedAt, module, mode, category, difficulty])

  const handleAnswer = useCallback(async (answer: string) => {
    const q = state.questions[state.currentIdx]
    if (!q || !state.session) return
    let is_correct = false
    try {
      const checkRes = await fetch("/api/questions/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: q.id, answer }),
      })
      if (checkRes.ok) {
        const d = await checkRes.json()
        is_correct = d.data?.is_correct ?? false
        dispatch({
          type: "PATCH_QUESTION_DETAILS",
          questionId: q.id,
          details: {
            answer: d.data?.correct_answer ?? "",
            explanation: d.data?.explanation ?? "",
            synergy_hint: d.data?.synergy_hint ?? q.synergy_hint,
            ai_dev_usage: d.data?.ai_dev_usage ?? q.ai_dev_usage,
          },
        })
      }
    } catch { /* 採点APIが失敗した場合は不正解として扱う */ }
    try {
      const res = await fetch(`/api/exam/${state.session.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: q.id, answer, time_spent: 30 }),
      })
      if (res.ok) { const d = await res.json(); is_correct = d.data?.is_correct ?? is_correct }
    } catch { /* ゲスト時はローカル採点 */ }
    dispatch({ type: "ANSWER", questionId: q.id, answer, correct: is_correct })
  }, [state.questions, state.currentIdx, state.session])

  // ── 制限エラー画面 ──────────────────────────────────────
  if (state.phase === "limit_reached") return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-black mb-2">本日の無料問題数に達しました</h1>
        <p className="text-gray-500 text-sm mb-6">
          無料プランは1日10問まで。<br />
          プレミアムプランで無制限に学習できます。
        </p>
        <Link href="/pricing"
          className="block w-full bg-brand text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition-colors mb-3">
          ✨ プレミアムで無制限に学ぶ
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">トップに戻る</Link>
      </div>
    </div>
  )

  // ── ローディング ────────────────────────────────────────
  if (state.phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">📝</div>
        <p className="text-gray-500 font-medium">問題を読み込み中...</p>
        <p className="text-xs text-gray-400 mt-2">今日の学習セットを準備しています</p>
      </div>
    </div>
  )

  if (state.phase === "empty" || state.phase === "error") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">{state.phase === "empty" ? "📚" : "⚠️"}</div>
        <h1 className="text-xl font-black text-gray-800 mb-2">
          {state.phase === "empty" ? "この条件の問題は準備中です" : "問題を読み込めませんでした"}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {state.phase === "empty"
            ? "別の分野または難易度を選ぶと、すぐに学習を続けられます。"
            : state.errorMessage}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/common/exam?module=SC" className="bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors">
            SCを学習する
          </Link>
          <Link href="/common/exam?module=AIF" className="bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors">
            AIFを学習する
          </Link>
        </div>
        <Link href="/" className="inline-block mt-5 text-sm text-gray-400 hover:text-gray-600">トップに戻る</Link>
      </div>
    </div>
  )

  // ── 試験完了画面 ────────────────────────────────────────
  if (state.phase === "finished") {
    const { correct, total, pct } = calcScore(state.results)
    const passing    = isPassing(pct)
    const wrongCount = Object.values(state.results).filter(v => !v).length
    const modeLabel  = difficulty ? DIFFICULTY_LABEL[difficulty] : category ? `#${category}` : (mode === "exam" ? "模擬試験" : "全問")
    const retryUrl   = `/common/exam?module=${module}${category ? `&category=${category}` : ""}${difficulty ? `&difficulty=${difficulty}` : ""}&mode=${mode}`
    const backUrl    = module === "AIF" ? "/aws-module" : module === "SC" ? "/sc-module" : "/"
    const summary    = summarizeStudyProgress(history)
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-6">
            <div className="text-6xl mb-3">{passing ? "🎉" : "💪"}</div>
            <p className="text-xs font-bold text-gray-400 mb-1">{modeLabel}</p>
            <h1 className="text-2xl font-black mb-2">{passing ? "合格ライン達成！" : "もう少し！"}</h1>
            <p className="text-gray-500 mb-4">{correct} / {total} 問正解</p>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div className={`h-full rounded-full transition-all duration-1000 ${passing ? "bg-green-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
            </div>
            <p className={`text-3xl font-black mb-1 ${passing ? "text-green-600" : "text-amber-600"}`}>{pct}%</p>
            <p className="text-xs text-gray-400 mb-6">合格ライン: 70%</p>
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] text-gray-400 font-bold">累計回答</p>
                <p className="text-lg font-black text-gray-800">{summary.totalAnswered}<span className="text-xs">問</span></p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] text-gray-400 font-bold">平均正答率</p>
                <p className="text-lg font-black text-gray-800">{summary.avgPct}<span className="text-xs">%</span></p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] text-gray-400 font-bold">連続学習</p>
                <p className="text-lg font-black text-gray-800">{summary.streakDays}<span className="text-xs">日</span></p>
              </div>
            </div>
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
                const userAns   = state.answers[q.id]
                const isCorrect = state.results[q.id]
                const isTimeout = userAns === "__timeout__"
                return (
                  <div key={q.id} className={`bg-white rounded-2xl border-2 p-5 ${isCorrect ? "border-green-200" : "border-red-200"}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`text-lg shrink-0 ${isCorrect ? "text-green-500" : "text-red-500"}`}>{isCorrect ? "✅" : "❌"}</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Q{i + 1} · {q.category} · 難易度{q.difficulty}</p>
                        <p className="font-medium text-gray-800 text-sm leading-relaxed">{q.question}</p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-1 text-xs">
                      <p className={`font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        あなたの回答: {isTimeout ? "⏱ タイムアップ" : (userAns ?? "未回答")}
                        {!isCorrect && !isTimeout && <span className="text-gray-500 ml-2">→ 正解: {q.answer || "確認中"}</span>}
                      </p>
                      <p className="text-gray-600 leading-relaxed">{q.explanation || "解説を取得できませんでした。"}</p>
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
  const progress = summarizeStudyProgress(history)
  const completionPct = Math.round(((state.currentIdx + (answered ? 1 : 0)) / state.questions.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(state.currentIdx / state.questions.length) * 100}%` }} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === "exam" && <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full">📋 模擬試験</span>}
            {difficulty && <span className="text-xs font-bold bg-indigo-50 text-brand px-2 py-1 rounded-full">{DIFFICULTY_LABEL[difficulty]}</span>}
            <span className="text-sm font-bold text-gray-500">{state.currentIdx + 1} / {state.questions.length}</span>
          </div>
          <ExamTimer key={state.currentIdx} timeLimitSeconds={180} onTimeUp={() => dispatch({ type: "TIME_UP" })} paused={state.phase === "reviewing"} />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <section className="mb-5 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-500 mb-1">今日の学習ミッション</p>
              <h2 className="text-lg font-black text-gray-800">
                {mode === "exam" ? "本番形式で20問に挑戦" : "10問で弱点を見つける"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                累計{progress.totalAnswered}問回答・平均正答率{progress.avgPct}%・復習候補{progress.needsReview}問
              </p>
            </div>
            <div className="min-w-[150px]">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span>このセット</span>
                <span>{completionPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>
        </section>
        <QuestionCard key={current.id} question={current} questionNumber={state.currentIdx + 1} total={state.questions.length} onAnswer={handleAnswer} disabled={state.phase === "reviewing"} />
        {state.mode === "study" && state.phase === "reviewing" && answered && (
          <ResultPanel question={current} userAnswer={answered} onNext={() => dispatch({ type: "NEXT" })} isLast={state.currentIdx === state.questions.length - 1} />
        )}
      </div>
    </div>
  )
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4 animate-bounce">📝</div><p className="text-gray-500 font-medium">読み込み中...</p></div></div>}>
      <ExamContent />
    </Suspense>
  )
}
