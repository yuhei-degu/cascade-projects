/**
 * APIクライアント — バックエンドとの通信を担当するモジュール
 * fetch を使った型安全なAPIアクセスレイヤー
 */

import type {
  CompanyDetailResponse,
  RankingResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** 共通フェッチラッパー */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

/** ランキング取得 */
export async function fetchRanking(params?: {
  page?: number;
  per_page?: number;
  sector?: string;
  min_score?: number;
}): Promise<RankingResponse> {
  const query = new URLSearchParams();
  if (params?.page)      query.set("page", String(params.page));
  if (params?.per_page)  query.set("per_page", String(params.per_page));
  if (params?.sector)    query.set("sector", params.sector);
  if (params?.min_score) query.set("min_score", String(params.min_score));
  const qs = query.toString() ? `?${query}` : "";
  return apiFetch<RankingResponse>(`/companies${qs}`);
}

/** 企業詳細取得 */
export async function fetchCompanyDetail(ticker: string): Promise<CompanyDetailResponse> {
  return apiFetch<CompanyDetailResponse>(`/companies/${ticker.toUpperCase()}`);
}

/** 手動再解析トリガー */
export async function triggerAnalysis(ticker: string): Promise<{ status: string; message: string }> {
  return apiFetch(`/analyze/${ticker}`, { method: "POST" });
}
