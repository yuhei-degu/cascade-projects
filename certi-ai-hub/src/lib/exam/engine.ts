// src/lib/exam/engine.ts
import type { Question, ExamSession } from "@/types"

export type ExamMode = "study" | "exam"  // study=即解説, exam=本番形式

export interface ExamState {
  mode:        ExamMode
  session:     ExamSession | null
  questions:   Question[]
  currentIdx:  number
  answers:     Record<string, string>
  results:     Record<string, boolean>
  phase:       "loading" | "running" | "reviewing" | "finished"
  startedAt:   number
}

export type ExamAction =
  | { type: "SET_SESSION";  session: ExamSession; questions: Question[]; mode: ExamMode }
  | { type: "ANSWER";       questionId: string; answer: string; correct: boolean }
  | { type: "NEXT" }
  | { type: "FINISH" }
  | { type: "TIME_UP" }
  | { type: "RETRY_WRONGS" }
  | { type: "RESET" }

export function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "SET_SESSION":
      return {
        ...initialExamState,          // currentIdx/answers/results を必ずリセット
        mode: action.mode,
        session: action.session,
        questions: action.questions,
        phase: "running",
        startedAt: Date.now(),
      }
    case "ANSWER": {
      const newState = {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
        results: { ...state.results, [action.questionId]: action.correct },
      }
      // examモード: reviewingをスキップして即次問題へ
      if (state.mode === "exam") {
        const next = state.currentIdx + 1
        if (next >= state.questions.length) return { ...newState, phase: "finished" }
        return { ...newState, currentIdx: next, phase: "running" }
      }
      return { ...newState, phase: "reviewing" }
    }
    case "NEXT": {
      const next = state.currentIdx + 1
      if (next >= state.questions.length) return { ...state, phase: "finished" }
      return { ...state, currentIdx: next, phase: "running" }
    }
    case "FINISH":
      return { ...state, phase: "finished" }
    case "TIME_UP": {
      const q = state.questions[state.currentIdx]
      const newResults = q ? { ...state.results, [q.id]: false } : state.results
      const newAnswers = q ? { ...state.answers, [q.id]: "__timeout__" } : state.answers
      const next = state.currentIdx + 1
      if (next >= state.questions.length)
        return { ...state, answers: newAnswers, results: newResults, phase: "finished" }
      return { ...state, answers: newAnswers, results: newResults, currentIdx: next, phase: "running" }
    }
    case "RETRY_WRONGS": {
      const wrongQuestions = state.questions.filter(q => state.results[q.id] === false)
      if (wrongQuestions.length === 0) return state
      const retrySession = state.session
        ? { ...state.session, id: crypto.randomUUID(), total: wrongQuestions.length, question_ids: wrongQuestions.map(q => q.id) }
        : state.session
      return {
        ...initialExamState, mode: "study",  // 復習は常にstudyモード
        session: retrySession, questions: wrongQuestions,
        phase: "running", startedAt: Date.now(),
      }
    }
    case "RESET":
      return { ...initialExamState }
    default:
      return state
  }
}

export const initialExamState: ExamState = {
  mode: "study", session: null, questions: [], currentIdx: 0,
  answers: {}, results: {}, phase: "loading", startedAt: 0,
}

export function calcScore(results: Record<string, boolean>) {
  const total   = Object.keys(results).length
  const correct = Object.values(results).filter(Boolean).length
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 }
}

export function isPassing(pct: number) { return pct >= 70 }
