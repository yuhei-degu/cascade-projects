import type { RankingResponse, ThemeDetailResponse } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function fetchRanking(params?: {
  page?: number; per_page?: number; category?: string;
  max_competition?: number; min_business_index?: number;
}): Promise<RankingResponse> {
  const q = new URLSearchParams();
  if (params?.page)               q.set("page", String(params.page));
  if (params?.per_page)           q.set("per_page", String(params.per_page));
  if (params?.category)           q.set("category", params.category);
  if (params?.max_competition != null)    q.set("max_competition", String(params.max_competition));
  if (params?.min_business_index != null) q.set("min_business_index", String(params.min_business_index));
  return apiFetch<RankingResponse>(`/themes${q.toString() ? "?" + q : ""}`);
}

export async function fetchThemeDetail(id: number): Promise<ThemeDetailResponse> {
  return apiFetch<ThemeDetailResponse>(`/themes/${id}`);
}

export async function fetchCategories(): Promise<{ categories: string[] }> {
  return apiFetch<{ categories: string[] }>("/categories");
}

export async function ingestTexts(texts: string[], source = "manual"): Promise<unknown> {
  return apiFetch("/ingest", { method: "POST", body: JSON.stringify({ texts, source }) });
}
