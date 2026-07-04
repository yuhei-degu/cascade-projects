import type { CompanyDetail, CompanyDetailResponse, CompanyRankingItem, RankingResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const fallbackCompanies: CompanyRankingItem[] = [
  {
    id: 1,
    ticker: "NVDA",
    name: "NVIDIA",
    sector: "AI半導体",
    industry: "Semiconductors",
    market_cap: 2850000000000,
    exchange: "NASDAQ",
    composite_score: 93,
    valuation_score: 1.8,
    tech_score: 98,
    growth_score: 94,
    profitability_score: 96,
    per: 58.2,
    peg: 1.55,
  },
  {
    id: 2,
    ticker: "PLTR",
    name: "Palantir Technologies",
    sector: "AIソフトウェア",
    industry: "Data Analytics",
    market_cap: 62000000000,
    exchange: "NYSE",
    composite_score: 88,
    valuation_score: 1.2,
    tech_score: 92,
    growth_score: 86,
    profitability_score: 78,
    per: 74.5,
    peg: 2.1,
  },
  {
    id: 3,
    ticker: "CRWD",
    name: "CrowdStrike",
    sector: "サイバーセキュリティ",
    industry: "Security Software",
    market_cap: 78000000000,
    exchange: "NASDAQ",
    composite_score: 84,
    valuation_score: 1.6,
    tech_score: 88,
    growth_score: 83,
    profitability_score: 76,
    per: 69.8,
    peg: 1.9,
  },
  {
    id: 4,
    ticker: "ARM",
    name: "Arm Holdings",
    sector: "半導体IP",
    industry: "Semiconductor IP",
    market_cap: 132000000000,
    exchange: "NASDAQ",
    composite_score: 81,
    valuation_score: 1.1,
    tech_score: 90,
    growth_score: 78,
    profitability_score: 85,
    per: 82.1,
    peg: 2.4,
  },
  {
    id: 5,
    ticker: "SOUN",
    name: "SoundHound AI",
    sector: "音声AI",
    industry: "AI Applications",
    market_cap: 2100000000,
    exchange: "NASDAQ",
    composite_score: 69,
    valuation_score: 2.7,
    tech_score: 72,
    growth_score: 74,
    profitability_score: 36,
    per: null,
    peg: null,
  },
];

function buildFallbackRanking(params?: { page?: number; per_page?: number; sector?: string }): RankingResponse {
  const page = params?.page ?? 1;
  const perPage = params?.per_page ?? 20;
  const filtered = params?.sector
    ? fallbackCompanies.filter((company) => company.sector === params.sector)
    : fallbackCompanies;
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return {
    data,
    score_date: "2026-05-22 デモ",
    meta: {
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil(filtered.length / perPage)),
    },
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchRanking(params?: {
  page?: number;
  per_page?: number;
  sector?: string;
  min_score?: number;
}): Promise<RankingResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.sector) query.set("sector", params.sector);
  if (params?.min_score) query.set("min_score", String(params.min_score));
  const qs = query.toString() ? `?${query}` : "";

  try {
    return await apiFetch<RankingResponse>(`/companies${qs}`);
  } catch {
    return buildFallbackRanking(params);
  }
}

export async function fetchCompanyDetail(ticker: string): Promise<CompanyDetailResponse> {
  const normalized = ticker.toUpperCase();

  try {
    return await apiFetch<CompanyDetailResponse>(`/companies/${normalized}`);
  } catch {
    const item = fallbackCompanies.find((company) => company.ticker === normalized);
    if (!item) throw new Error(`Unknown fallback ticker: ${normalized}`);

    const detail: CompanyDetail = {
      ...item,
      description: `${item.name} のAI関連テーマを、技術力・成長性・収益性・割安感で確認するためのデモ詳細です。実投資の判断には最新の決算、競争環境、バリュエーションを別途確認してください。`,
      latest_score: {
        score_date: "2026-05-22 デモ",
        tech_score: item.tech_score,
        growth_score: item.growth_score,
        profitability_score: item.profitability_score,
        composite_score: item.composite_score,
        valuation_score: item.valuation_score,
        per_used: item.per,
        peg_used: item.peg,
        breakdown: {
          keyword_score: item.tech_score,
          patent_score: item.tech_score ? Math.max(0, item.tech_score - 8) : null,
          rd_ratio_score: item.growth_score,
          paper_score: item.tech_score ? Math.max(0, item.tech_score - 12) : null,
        },
        model_version: "fallback-demo-v1",
      },
      latest_financials: {
        date: "2026-05-22",
        per: item.per,
        peg: item.peg,
        ev_ebitda: null,
        pb_ratio: null,
        ps_ratio: null,
        revenue_yoy: item.growth_score ? item.growth_score / 300 : null,
        eps_growth_yoy: item.growth_score ? item.growth_score / 350 : null,
        gross_margin: item.profitability_score ? item.profitability_score / 140 : null,
        operating_margin: item.profitability_score ? item.profitability_score / 260 : null,
        net_margin: item.profitability_score ? item.profitability_score / 320 : null,
        fcf_margin: item.profitability_score ? item.profitability_score / 360 : null,
        rd_ratio: item.tech_score ? item.tech_score / 700 : null,
      },
      patent_count: Math.round((item.tech_score ?? 50) * 12),
      ai_patent_count: Math.round((item.tech_score ?? 50) * 4),
      updated_at: "2026-05-22",
    };

    return { data: detail };
  }
}

export async function triggerAnalysis(ticker: string): Promise<{ status: string; message: string }> {
  return apiFetch(`/analyze/${ticker}`, { method: "POST" });
}
