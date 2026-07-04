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
  phase:       "loading" | "running" | "reviewing" | "finished" | "limit_reached" | "empty" | "error"
  startedAt:   number
  errorMessage?: string
}

export type ExamAction =
  | { type: "SET_SESSION";  session: ExamSession; questions: Question[]; mode: ExamMode }
  | { type: "ANSWER";       questionId: string; answer: string; correct: boolean }
  | { type: "PATCH_QUESTION_DETAILS"; questionId: string; details: Partial<Question> }
  | { type: "NEXT" }
  | { type: "FINISH" }
  | { type: "TIME_UP" }
  | { type: "RETRY_WRONGS" }
  | { type: "RESET" }
  | { type: "LIMIT_REACHED" }
  | { type: "SET_EMPTY" }
  | { type: "SET_ERROR"; message: string }

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
    case "PATCH_QUESTION_DETAILS":
      return {
        ...state,
        questions: state.questions.map((question) =>
          question.id === action.questionId
            ? { ...question, ...action.details }
            : question,
        ),
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
    case "LIMIT_REACHED":
      return { ...initialExamState, phase: "limit_reached" }
    case "SET_EMPTY":
      return { ...initialExamState, phase: "empty" }
    case "SET_ERROR":
      return { ...initialExamState, phase: "error", errorMessage: action.message }
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

export interface LocalStudySessionRecord {
  date: string
  module: ExamSession["module"]
  correct: number
  total: number
  pct: number
  mode: ExamMode
  category?: string
  difficulty?: string
  finishedAt?: string
  durationSeconds?: number
}

export interface ModuleStudySummary {
  module: ExamSession["module"]
  sessions: number
  answered: number
  correct: number
  avgPct: number
}

export interface StudyProgressSummary {
  sessions: number
  totalAnswered: number
  totalCorrect: number
  avgPct: number
  passedSessions: number
  studyDays: number
  streakDays: number
  needsReview: number
  bestPct: number
  lastSession: LocalStudySessionRecord | null
  modules: ModuleStudySummary[]
}

function toDateKey(value: Date) {
  return value.toLocaleDateString("ja-JP")
}

function normalizeDateKey(value: string | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return toDateKey(parsed)
  return value
}

export function summarizeStudyProgress(
  records: LocalStudySessionRecord[],
  now: Date = new Date(),
): StudyProgressSummary {
  const validRecords = records.filter((record) => record.total > 0)
  const totalAnswered = validRecords.reduce((sum, record) => sum + record.total, 0)
  const totalCorrect = validRecords.reduce((sum, record) => sum + record.correct, 0)
  const avgPct = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0
  const dayKeys = new Set(validRecords.map((record) => normalizeDateKey(record.finishedAt) ?? record.date))
  const moduleMap = new Map<ExamSession["module"], { sessions: number; answered: number; correct: number }>()

  for (const record of validRecords) {
    const prev = moduleMap.get(record.module) ?? { sessions: 0, answered: 0, correct: 0 }
    moduleMap.set(record.module, {
      sessions: prev.sessions + 1,
      answered: prev.answered + record.total,
      correct: prev.correct + record.correct,
    })
  }

  let streakDays = 0
  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)
  while (dayKeys.has(toDateKey(cursor))) {
    streakDays += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    sessions: validRecords.length,
    totalAnswered,
    totalCorrect,
    avgPct,
    passedSessions: validRecords.filter((record) => isPassing(record.pct)).length,
    studyDays: dayKeys.size,
    streakDays,
    needsReview: validRecords.reduce((sum, record) => sum + Math.max(record.total - record.correct, 0), 0),
    bestPct: validRecords.reduce((best, record) => Math.max(best, record.pct), 0),
    lastSession: validRecords.at(-1) ?? null,
    modules: [...moduleMap.entries()].map(([module, stat]) => ({
      module,
      sessions: stat.sessions,
      answered: stat.answered,
      correct: stat.correct,
      avgPct: stat.answered ? Math.round((stat.correct / stat.answered) * 100) : 0,
    })),
  }
}
