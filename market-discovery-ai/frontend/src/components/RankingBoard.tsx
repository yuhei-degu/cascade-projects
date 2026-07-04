"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { fetchRanking } from "@/lib/api";
import type { RankingResponse, ThemeRankingItem } from "@/types";
import {
  getCompetitionColor,
  getCompetitionLabel,
  getCompetitionText,
  getScoreBarColor,
  getScreeningStatusClass,
  getScreeningStatusText,
} from "@/types";

interface Props {
  initialData: RankingResponse;
  categories: string[];
}

export function RankingBoard({ initialData, categories }: Props) {
  const [data, setData] = useState(initialData);
  const [category, setCategory] = useState("");
  const [lowCompetitionOnly, setLowCompetitionOnly] = useState(false);
  const [minIndex, setMinIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  function load(next?: { category?: string; lowCompetitionOnly?: boolean; minIndex?: number }) {
    const nextCategory = next?.category ?? category;
    const nextLow = next?.lowCompetitionOnly ?? lowCompetitionOnly;
    const nextMin = next?.minIndex ?? minIndex;
    startTransition(async () => {
      setData(
        await fetchRanking({
          per_page: 20,
          category: nextCategory || undefined,
          max_competition: nextLow ? 50 : undefined,
          min_business_index: nextMin > 0 ? nextMin : undefined,
        }),
      );
    });
  }

  return (
    <div className={`space-y-3 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
      <div className="rounded-lg border border-stone-200 bg-[#fffdfa] p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              load({ category: event.target.value });
            }}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-teal-500"
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              const next = !lowCompetitionOnly;
              setLowCompetitionOnly(next);
              load({ lowCompetitionOnly: next });
            }}
            className={`h-10 rounded-md border px-3 text-sm font-medium transition ${
              lowCompetitionOnly
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            競合少なめ
          </button>

          <label className="flex h-10 min-w-[250px] items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-600">
            最低スコア
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minIndex}
              onChange={(event) => {
                const next = Number(event.target.value);
                setMinIndex(next);
                load({ minIndex: next });
              }}
              className="w-28 accent-teal-600"
            />
            <span className="w-8 font-semibold text-teal-700">{minIndex}</span>
          </label>

          <span className="ml-auto rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
            表示 {data.data.length}件 / 全体 {data.meta.total}件
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {data.data.map((theme, index) => (
          <ThemeCard key={theme.id} theme={theme} rank={index + 1} />
        ))}
        {data.data.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white py-16 text-center text-stone-500">
            条件に合う候補がありません。
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ThemeCard({ theme, rank }: { theme: ThemeRankingItem; rank: number }) {
  return (
    <Link
      href={`/theme/${theme.id}`}
      className="block rounded-lg border border-stone-200 bg-[#fffdfa] p-4 shadow-sm transition hover:border-teal-300 hover:bg-white"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-stone-500">#{rank}</span>
            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getScreeningStatusClass(theme.screening_status)}`}>
              {getScreeningStatusText(theme.screening_status)}
            </span>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">{theme.category}</span>
          </div>
          <h2 className="text-lg font-bold leading-6 text-stone-950">{theme.title}</h2>
          {theme.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{theme.description}</p> : null}
          {theme.screening_reason ? <p className="mt-2 max-w-3xl text-xs leading-5 text-teal-800">判定: {theme.screening_reason}</p> : null}
        </div>

        <div className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 lg:text-right">
          <div className="text-3xl font-black tabular-nums text-emerald-700">{theme.business_index?.toFixed(1) ?? "-"}</div>
          <div className="text-xs text-emerald-900">総合スコア</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="需要" score={theme.demand_score} />
        <Metric label="収益化" score={theme.monetization_score} />
        <Metric label="根拠" score={theme.evidence_strength ?? null} />
        <Metric label="日本市場" score={theme.japanese_market_fit ?? null} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <div className="mb-1 text-xs text-stone-500">競合</div>
          <CompetitionBadge score={theme.competition_score} />
        </div>
        <Metric label="作りやすさ" score={theme.dev_difficulty_score === null ? null : 100 - theme.dev_difficulty_score} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(theme.top_keywords ?? []).slice(0, 7).map((keyword) => (
          <span key={keyword} className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600">
            {keyword}
          </span>
        ))}
      </div>
    </Link>
  );
}

function CompetitionBadge({ score }: { score: number | null }) {
  const label = getCompetitionLabel(score);
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getCompetitionColor(label)}`}>
      {getCompetitionText(label)}
    </span>
  );
}

function Metric({ label, score }: { label: string; score: number | null }) {
  return (
    <div>
      <div className="mb-1 text-xs text-stone-500">{label}</div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
          <div className={`h-full rounded-full ${getScoreBarColor(score)}`} style={{ width: `${score ?? 0}%` }} />
        </div>
        <span className="w-8 text-right text-xs tabular-nums text-stone-500">{score?.toFixed(0) ?? "-"}</span>
      </div>
    </div>
  );
}
