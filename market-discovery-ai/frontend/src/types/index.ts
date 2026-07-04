export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
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
  evidence_strength?: number | null;
  japanese_market_fit?: number | null;
  screening_status?: string;
  screening_reason?: string | null;
}

export interface ThemeDetail extends ThemeRankingItem {
  score: BusinessScore | null;
  keywords_list: { word: string; tfidf_score: number; is_monetization: boolean }[] | null;
  updated_at: string | null;
  opportunity?: string | null;
  target_user?: string | null;
  willingness_to_pay?: string | null;
  first_cut_goal?: string | null;
  recommended_project_name?: string | null;
  automation_slug?: string | null;
  mvp_scope?: string[] | null;
  risks?: string[] | null;
  evidence?: string[] | null;
  source_urls?: string[] | null;
  source_types?: string[] | null;
  collection_queries?: string[] | null;
  pass_reasons?: string[] | null;
  reject_reasons?: string[] | null;
  next_research_actions?: string[] | null;
}

export interface RankingResponse {
  data: ThemeRankingItem[];
  meta: PaginationMeta;
  score_date: string;
  filters_applied: Record<string, unknown>;
}

export interface ThemeDetailResponse {
  data: ThemeDetail;
}

export type CompetitionLabel = "very_low" | "low" | "medium" | "high" | "unknown";

export function getCompetitionLabel(score: number | null): CompetitionLabel {
  if (score === null) return "unknown";
  if (score <= 25) return "very_low";
  if (score <= 50) return "low";
  if (score <= 75) return "medium";
  return "high";
}

export function getCompetitionColor(label: CompetitionLabel): string {
  return {
    very_low: "text-emerald-700 bg-emerald-50 border-emerald-200",
    low: "text-lime-700 bg-lime-50 border-lime-200",
    medium: "text-amber-800 bg-amber-50 border-amber-200",
    high: "text-rose-800 bg-rose-50 border-rose-200",
    unknown: "text-stone-700 bg-stone-50 border-stone-200",
  }[label];
}

export function getCompetitionText(label: CompetitionLabel): string {
  return {
    very_low: "かなり少ない",
    low: "少ない",
    medium: "中程度",
    high: "多い",
    unknown: "不明",
  }[label];
}

export function getScreeningStatusText(status?: string): string {
  return {
    auto_develop: "自動開発へ投入",
    watch: "追加調査",
    rejected: "除外",
    reject: "除外",
    candidate: "候補",
  }[status ?? "candidate"] ?? "候補";
}

export function getScreeningStatusClass(status?: string): string {
  return {
    auto_develop: "border-emerald-200 bg-emerald-50 text-emerald-800",
    watch: "border-amber-200 bg-amber-50 text-amber-900",
    rejected: "border-stone-200 bg-stone-100 text-stone-600",
    reject: "border-stone-200 bg-stone-100 text-stone-600",
    candidate: "border-teal-200 bg-teal-50 text-teal-800",
  }[status ?? "candidate"] ?? "border-teal-200 bg-teal-50 text-teal-800";
}

export function getScoreBarColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "bg-stone-300";
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-rose-500";
}
