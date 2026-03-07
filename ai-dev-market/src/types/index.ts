/**
 * TypeScript 型定義 & 定数
 */
export type RequestStatus =
  | "pending" | "reviewing" | "rejected"
  | "prototype_ready" | "prototype_ok"
  | "payment_pending" | "paid"
  | "delivered" | "revision" | "closed";

export type AiVerdict = "A" | "B" | "C";

export type RequestCategory =
  | "script" | "web_tool" | "api_integration"
  | "dashboard" | "website" | "other";

export type BudgetRange =
  | "under_10k" | "under_20k" | "under_30k" | "negotiable";

// ── ラベル定義 ───────────────────────────────────────────────
export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending:         "📬 受付待ち",
  reviewing:       "🤖 AI審査中",
  rejected:        "❌ 却下",
  prototype_ready: "👀 試作確認待ち",
  prototype_ok:    "✅ 試作承認済み",
  payment_pending: "💳 決済待ち",
  paid:            "⚡ 開発中",
  delivered:       "📦 納品完了",
  revision:        "🔧 修正中",
  closed:          "🏁 完了",
};

export const STATUS_COLOR: Record<RequestStatus, string> = {
  pending:         "bg-gray-100 text-gray-700",
  reviewing:       "bg-blue-100 text-blue-700",
  rejected:        "bg-red-100 text-red-700",
  prototype_ready: "bg-amber-100 text-amber-700",
  prototype_ok:    "bg-green-100 text-green-700",
  payment_pending: "bg-yellow-100 text-yellow-700",
  paid:            "bg-violet-100 text-violet-700",
  delivered:       "bg-teal-100 text-teal-700",
  revision:        "bg-orange-100 text-orange-700",
  closed:          "bg-gray-200 text-gray-600",
};

export const VERDICT_LABEL: Record<AiVerdict, string> = {
  A: "✅ 作成可能",
  B: "⚠️ 条件付き可能",
  C: "❌ 難しい",
};

export const VERDICT_COLOR: Record<AiVerdict, string> = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-red-100 text-red-700",
};

export const CATEGORY_LABEL: Record<RequestCategory, string> = {
  script:          "スクリプト・自動化",
  web_tool:        "Webツール",
  api_integration: "API連携",
  dashboard:       "ダッシュボード",
  website:         "Webサイト・LP",
  other:           "その他",
};

export const BUDGET_LABEL: Record<BudgetRange, string> = {
  under_10k:  "¥10,000以下",
  under_20k:  "¥20,000以下",
  under_30k:  "¥30,000以下",
  negotiable: "要相談",
};

export const BUDGET_AMOUNT: Record<BudgetRange, number> = {
  under_10k: 10000, under_20k: 20000, under_30k: 30000, negotiable: 20000,
};

// ── DTO型 ────────────────────────────────────────────────────
export interface Request {
  id: string; title: string; description: string;
  category: RequestCategory; budget: BudgetRange;
  deadline?: string; email: string;
  status: RequestStatus;
  ai_verdict?: AiVerdict; ai_score?: number;
  ai_estimated_hours?: number; ai_estimated_price?: number;
  prototype_code?: string; prototype_lang?: string; prototype_note?: string;
  preview_token?: string; preview_expires_at?: string;
  deliverable_url?: string; deliverable_note?: string;
  stripe_session_id?: string; paid_amount?: number; paid_at?: string;
  free_revision_used: boolean;
  created_at: string; updated_at: string;
}

export interface AiEvaluation {
  id: string; request_id: string; model: string;
  verdict: AiVerdict; score: number;
  estimated_hours?: number; estimated_price?: number;
  concerns?: string[]; suggestions?: string;
  created_at: string;
}

export interface Message {
  id: string; request_id: string; author: string;
  content: string; is_internal: boolean; created_at: string;
}

export interface NewRequestInput {
  title: string; description: string;
  category: RequestCategory; budget: BudgetRange;
  deadline?: string; email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean; data?: T; error?: string;
}
