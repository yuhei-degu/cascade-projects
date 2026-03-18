// src/types/index.ts
// ── 問題・試験 ────────────────────────────────────────────

export type Module = "SC" | "AIF"

export type ScCategory =
  | "crypto"        // 暗号・PKI
  | "threat"        // 脅威・攻撃手法
  | "coding"        // セキュアコーディング
  | "ai_threat"     // AI脅威（プロンプトインジェクション等）
  | "management"    // セキュリティマネジメント

export type AifCategory =
  | "bedrock"         // Amazon Bedrock
  | "sagemaker"       // SageMaker
  | "responsible_ai"  // 責任あるAI
  | "sdk"             // AWS SDK連携
  | "usecase"         // GenAIユースケース
  | "ml_basics"       // 機械学習基礎
  | "generative_ai"   // 生成AI概念

export type Category = ScCategory | AifCategory

export interface QuestionOption {
  key: string   // "A" | "B" | "C" | "D"
  text: string
}

export interface Question {
  id: string
  module: Module
  category: Category
  difficulty: 1 | 2 | 3
  question: string
  options: QuestionOption[] | null  // null = 記述式
  answer: string
  explanation: string
  code_snippet?: string
  synergy_hint?: string
  hint?: string
  tags: string[]
  created_at: string
}

// ── 試験セッション ─────────────────────────────────────────

export type SessionStatus = "active" | "completed" | "abandoned"

export interface ExamSession {
  id: string
  user_id: string
  module: Module | "MIXED"
  status: SessionStatus
  started_at: string
  finished_at?: string
  time_limit: number          // 秒
  question_ids: string[]
  answers: Record<string, string>
  score: number
  total: number
}

export interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  session_id: string
  is_correct: boolean
  answered_at: string
  time_spent: number
}

// ── 進捗・分析 ─────────────────────────────────────────────

export interface UserProgress {
  user_id: string
  sc_accuracy: number
  aws_accuracy: number
  weak_categories: Category[]
  study_streak: number
  last_studied_at: string
  exam_date_sc?: string
  exam_date_aws?: string
}

export interface SynergyLink {
  id: string
  sc_question_id: string
  aws_question_id: string
  link_type: "concept" | "implementation" | "threat_countermeasure"
  description: string
}

// ── AI機能 ────────────────────────────────────────────────

export interface HintRequest {
  question_id: string
  question: string
  user_answer?: string
}

export interface HintResponse {
  hint: string
  concept: string     // 関連する概念名
  synergy?: string    // SC↔AWS相互学習ヒント
}

export interface AnalysisReport {
  overall_score: number
  weak_categories: { category: Category; accuracy: number }[]
  recommendation: string
  next_study_focus: string
}

// ── API レスポンス ────────────────────────────────────────

export interface ApiOk<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: string
}

export type ApiResponse<T> = ApiOk<T> | ApiError
