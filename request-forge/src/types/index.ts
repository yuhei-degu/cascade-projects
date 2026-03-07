/**
 * TypeScript 型定義 — RequestForge
 */

export type RequestStatus =
  | "pending" | "reviewing" | "rejected" | "accepted"
  | "building" | "review_ready" | "revision"
  | "payment_pending" | "paid" | "delivered";

export type RequestCategory =
  | "website" | "webapp" | "script" | "design" | "consultation" | "other";

export type BudgetRange =
  | "under_5k" | "under_10k" | "under_30k" | "under_50k" | "negotiable";

/** ステータスの日本語ラベル */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending:         "受付待ち",
  reviewing:       "AI審査中",
  rejected:        "却下",
  accepted:        "承認済み",
  building:        "制作中",
  review_ready:    "確認待ち",
  revision:        "修正中",
  payment_pending: "決済待ち",
  paid:            "決済完了",
  delivered:       "納品完了",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending:         "bg-gray-100 text-gray-700",
  reviewing:       "bg-blue-100 text-blue-700",
  rejected:        "bg-red-100 text-red-700",
  accepted:        "bg-green-100 text-green-700",
  building:        "bg-violet-100 text-violet-700",
  review_ready:    "bg-amber-100 text-amber-700",
  revision:        "bg-orange-100 text-orange-700",
  payment_pending: "bg-yellow-100 text-yellow-700",
  paid:            "bg-emerald-100 text-emerald-700",
  delivered:       "bg-teal-100 text-teal-700",
};

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  website:      "Webサイト",
  webapp:       "Webアプリ",
  script:       "スクリプト・自動化",
  design:       "デザイン",
  consultation: "相談・コンサル",
  other:        "その他",
};

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_5k:   "¥5,000 以下",
  under_10k:  "¥10,000 以下",
  under_30k:  "¥30,000 以下",
  under_50k:  "¥50,000 以下",
  negotiable: "要相談",
};

/** AI評価結果 */
export interface AiEvaluationResult {
  model: string;
  feasible: boolean;
  feasibilityScore: number;
  estimatedHours?: number;
  estimatedPrice?: number;
  concerns: string[];
  suggestions?: string;
}

/** 依頼フォーム送信データ */
export interface NewRequestInput {
  title: string;
  description: string;
  category: RequestCategory;
  budget: BudgetRange;
  deadline?: string;
  email: string;
}

/** API レスポンス共通ラッパー */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
