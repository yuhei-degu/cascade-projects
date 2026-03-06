/**
 * ⑯ フロントエンド型定義 (TypeScript)
 */

export interface PaginationMeta {
  total: number; page: number; per_page: number; total_pages: number;
}

export interface MonetizationBreakdown {
  money_word_score: number | null;
  urgency_score: number | null;
  purchase_intent_score: number | null;
  severity_score: number | null;
}

export interface CompetitionBreakdown {
  search_volume_score: number | null;
  app_exists_score: number | null;
  ad_spend_score: number | null;
}

export interface BusinessScore {
  score_date: string;
  demand_score: number | null;
  monetization_score: number | null;
  competition_score: number | null;
  dev_difficulty_score: number | null;
  business_index: number | null;
  monetization_detail: MonetizationBreakdown | null;
  competition_detail: CompetitionBreakdown | null;
  model_version: string;
}

export type CompetitionLabel = "very_low" | "low" | "medium" | "high" | "unknown";

export interface ThemeRankingItem {
  id: number;
  title: string;
  category: string;
  description: string | null;
  top_keywords: string[] | null;
  post_count: number;
  comment_count_total: number;
  post_growth_rate: number;
  biz_models: string[] | null;
  business_index: number | null;
  demand_score: number | null;
  monetization_score: number | null;
  competition_score: number | null;
  dev_difficulty_score: number | null;
}

export interface ThemeDetail extends ThemeRankingItem {
  score: BusinessScore | null;
  keywords_list: { word: string; tfidf_score: number; is_monetization: boolean }[] | null;
  updated_at: string | null;
}

export interface RankingResponse {
  data: ThemeRankingItem[];
  meta: PaginationMeta;
  score_date: string;
  filters_applied: Record<string, unknown>;
}

export interface ThemeDetailResponse { data: ThemeDetail; }

// ── ユーティリティ関数 ──────────────────────────────────────────────

export function getCompetitionLabel(score: number | null): CompetitionLabel {
  if (score === null) return "unknown";
  if (score <= 25) return "very_low";
  if (score <= 50) return "low";
  if (score <= 75) return "medium";
  return "high";
}

export function getCompetitionColor(label: CompetitionLabel): string {
  return {
    very_low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    low:      "text-green-400 bg-green-400/10 border-green-400/30",
    medium:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    high:     "text-red-400 bg-red-400/10 border-red-400/30",
    unknown:  "text-gray-400 bg-gray-400/10 border-gray-400/30",
  }[label];
}

export function getCompetitionText(label: CompetitionLabel): string {
  return { very_low: "激低競合", low: "低競合", medium: "中競合", high: "高競合", unknown: "—" }[label];
}

export function getBusinessIndexColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 30) return "text-orange-400";
  return "text-red-400";
}

export function getScoreBarColor(score: number | null): string {
  if (score === null) return "bg-gray-700";
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}
