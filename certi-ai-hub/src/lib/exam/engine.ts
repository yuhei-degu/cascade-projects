// src/lib/exam/engine.ts — TASK-017
import type { Question, ExamSession } from "@/types"

export interface ExamState {
  session:     ExamSession | null
  questions:   Question[]
  currentIdx:  number
  answers:     Record<string, string>   // question_id → answered key
  results:     Record<string, boolean>  // question_id → is_correct
  phase:       "loading" | "running" | "reviewing" | "finished"
  startedAt:   number   // Date.now()
}

export type ExamAction =
  | { type: "SET_SESSION";   session: ExamSession; questions: Question[] }
  | { type: "ANSWER";        questionId: string; answer: string; correct: boolean }
  | { type: "NEXT" }
  | { type: "FINISH" }
  | { type: "TIME_UP" }

export function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "SET_SESSION":
      return { ...state, session: action.session, questions: action.questions, phase: "running", startedAt: Date.now() }
    case "ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
        results: { ...state.results, [action.questionId]: action.correct },
        phase: "reviewing",
      }
    case "NEXT": {
      const next = state.currentIdx + 1
      if (next >= state.questions.length) return { ...state, phase: "finished" }
      return { ...state, currentIdx: next, phase: "running" }
    }
    case "FINISH":
    case "TIME_UP":
      return { ...state, phase: "finished" }
    default:
      return state
  }
}

export const initialExamState: ExamState = {
  session: null, questions: [], currentIdx: 0,
  answers: {}, results: {}, phase: "loading", startedAt: 0,
}

/** 最終スコアを計算 */
export function calcScore(results: Record<string, boolean>) {
  const total   = Object.keys(results).length
  const correct = Object.values(results).filter(Boolean).length
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 }
}

/** 合格判定（70%以上） */
export function isPassing(pct: number) { return pct >= 70 }
