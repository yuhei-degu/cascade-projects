/**
 * ⑦ フロントエンド型定義 (TypeScript)
 * バックエンド Pydantic スキーマに対応する型定義
 */

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ScoreBreakdown {
  keyword_score: number | null;
  patent_score: number | null;
  rd_ratio_score: number | null;
  paper_score: number | null;
}

export interface AIScore {
  score_date: string;
  tech_score: number | null;
  growth_score: number | null;
  profitability_score: number | null;
  composite_score: number | null;
  valuation_score: number | null;
  per_used: number | null;
  peg_used: number | null;
  breakdown: ScoreBreakdown | null;
  model_version: string;
}

export interface FinancialMetric {
  date: string;
  per: number | null;
  peg: number | null;
  ev_ebitda: number | null;
  pb_ratio: number | null;
  ps_ratio: number | null;
  revenue_yoy: number | null;
  eps_growth_yoy: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  fcf_margin: number | null;
  rd_ratio: number | null;
}

export type ValuationLabel = "very_cheap" | "cheap" | "fair" | "expensive" | "unknown";

export interface CompanyRankingItem {
  id: number;
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  exchange: string | null;
  composite_score: number | null;
  valuation_score: number | null;
  tech_score: number | null;
  growth_score: number | null;
  profitability_score: number | null;
  per: number | null;
  peg: number | null;
}

export interface CompanyDetail extends CompanyRankingItem {
  description: string | null;
  latest_score: AIScore | null;
  latest_financials: FinancialMetric | null;
  patent_count: number;
  ai_patent_count: number;
  updated_at: string | null;
}

export interface RankingResponse {
  data: CompanyRankingItem[];
  meta: PaginationMeta;
  score_date: string;
}

export interface CompanyDetailResponse {
  data: CompanyDetail;
}

/** 割安度ラベルを判定する */
export function getValuationLabel(score: number | null): ValuationLabel {
  if (score === null) return "unknown";
  if (score >= 5.0) return "very_cheap";
  if (score >= 2.5) return "cheap";
  if (score >= 1.0) return "fair";
  return "expensive";
}

/** 割安度に対応するTailwind色クラスを返す */
export function getValuationColorClass(label: ValuationLabel): string {
  const map: Record<ValuationLabel, string> = {
    very_cheap: "bg-emerald-100 text-emerald-800 border-emerald-300",
    cheap:      "bg-green-100 text-green-800 border-green-300",
    fair:       "bg-yellow-100 text-yellow-800 border-yellow-300",
    expensive:  "bg-red-100 text-red-800 border-red-300",
    unknown:    "bg-gray-100 text-gray-500 border-gray-300",
  };
  return map[label];
}

/** スコアバーのTailwind色を返す */
export function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}

/** 時価総額を人が読みやすい形式にフォーマットする */
export function formatMarketCap(value: number | null): string {
  if (value === null) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

/** 数値を % 表示にフォーマットする */
export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "N/A";
  return `${(value * 100).toFixed(digits)}%`;
}
