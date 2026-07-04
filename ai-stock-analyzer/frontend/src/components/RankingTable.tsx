"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { fetchRanking } from "@/lib/api";
import type { CompanyRankingItem, RankingResponse, ValuationLabel } from "@/types";
import { formatMarketCap, getScoreBarColor, getValuationColorClass, getValuationLabel } from "@/types";

interface Props {
  initialData: RankingResponse;
}

function ScoreBar({ score }: { score: number | null }) {
  const value = score ?? 0;

  return (
    <div className="flex min-w-[128px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(value)}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-slate-400">
        {score !== null ? score.toFixed(1) : "-"}
      </span>
    </div>
  );
}

function ValuationBadge({ score }: { score: number | null }) {
  const label = getValuationLabel(score);
  const labelText: Record<ValuationLabel, string> = {
    very_cheap: "かなり割安",
    cheap: "割安",
    fair: "妥当",
    expensive: "割高",
    unknown: "不明",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getValuationColorClass(label)}`}>
      {labelText[label]}
    </span>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <span className="ml-1 text-slate-600">↕</span>;
  return <span className="ml-1 text-cyan-300">{direction === "desc" ? "↓" : "↑"}</span>;
}

const columns: { key: keyof CompanyRankingItem; label: string; numeric?: boolean; score?: boolean }[] = [
  { key: "ticker", label: "ティッカー" },
  { key: "name", label: "企業名" },
  { key: "sector", label: "テーマ" },
  { key: "composite_score", label: "総合", numeric: true, score: true },
  { key: "tech_score", label: "技術", numeric: true, score: true },
  { key: "growth_score", label: "成長", numeric: true, score: true },
  { key: "profitability_score", label: "収益", numeric: true, score: true },
  { key: "valuation_score", label: "割安", numeric: true },
  { key: "per", label: "PER", numeric: true },
  { key: "peg", label: "PEG", numeric: true },
  { key: "market_cap", label: "時価総額", numeric: true },
];

function getComparableValue(item: CompanyRankingItem, key: keyof CompanyRankingItem) {
  const value = item[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return "";
}

export function RankingTable({ initialData }: Props) {
  const [data, setData] = useState<RankingResponse>(initialData);
  const [sortKey, setSortKey] = useState<keyof CompanyRankingItem>("composite_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sectorFilter, setSectorFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const sectors = useMemo(
    () => Array.from(new Set(data.data.map((company) => company.sector).filter(Boolean))) as string[],
    [data.data],
  );

  const filteredData = useMemo(() => {
    const filtered = sectorFilter
      ? data.data.filter((company) => company.sector === sectorFilter)
      : data.data;

    return [...filtered].sort((a, b) => {
      const av = getComparableValue(a, sortKey);
      const bv = getComparableValue(b, sortKey);

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "desc" ? bv - av : av - bv;
      }

      return sortDir === "desc"
        ? String(bv).localeCompare(String(av), "ja")
        : String(av).localeCompare(String(bv), "ja");
    });
  }, [data.data, sectorFilter, sortDir, sortKey]);

  function handleSort(key: keyof CompanyRankingItem) {
    if (sortKey === key) {
      setSortDir((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(key);
    setSortDir("desc");
  }

  function loadPage(page: number) {
    startTransition(async () => {
      const newData = await fetchRanking({ page, per_page: 20, sector: sectorFilter || undefined });
      setData(newData);
    });
  }

  return (
    <div className={`transition-opacity ${isPending ? "opacity-55" : "opacity-100"}`}>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <label className="text-sm font-semibold text-slate-300" htmlFor="sector-filter">テーマ</label>
        <select
          id="sector-filter"
          value={sectorFilter}
          onChange={(event) => setSectorFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400"
        >
          <option value="">すべて</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-slate-500">
          {filteredData.length}件 / 評価日 {data.score_date}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900">
              <th className="w-10 px-3 py-3 text-left font-semibold text-slate-500">#</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-3 text-left font-semibold text-slate-400 hover:text-slate-100"
                >
                  {column.label}
                  <SortIcon active={sortKey === column.key} direction={sortDir} />
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-3 text-left font-semibold text-slate-400">割安度</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((company, index) => (
              <tr key={company.id} className="border-b border-slate-800/60 transition-colors hover:bg-slate-900/70">
                <td className="px-3 py-3.5 text-xs font-semibold text-slate-600">{index + 1}</td>
                <td className="px-3 py-3.5 font-mono font-bold text-cyan-300">
                  <Link href={`/company/${company.ticker}`} className="hover:underline">
                    {company.ticker}
                  </Link>
                </td>
                <td className="max-w-[220px] truncate px-3 py-3.5 text-slate-100">
                  <Link href={`/company/${company.ticker}`} className="hover:text-cyan-200">
                    {company.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-400">{company.sector ?? "-"}</td>
                <td className="px-3 py-3.5"><ScoreBar score={company.composite_score} /></td>
                <td className="px-3 py-3.5"><ScoreBar score={company.tech_score} /></td>
                <td className="px-3 py-3.5"><ScoreBar score={company.growth_score} /></td>
                <td className="px-3 py-3.5"><ScoreBar score={company.profitability_score} /></td>
                <td className="px-3 py-3.5 text-slate-300 tabular-nums">{company.valuation_score !== null ? company.valuation_score.toFixed(1) : "-"}</td>
                <td className="px-3 py-3.5 text-slate-300 tabular-nums">{company.per !== null ? company.per.toFixed(1) : "-"}</td>
                <td className="px-3 py-3.5 text-slate-300 tabular-nums">{company.peg !== null ? company.peg.toFixed(2) : "-"}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-400 tabular-nums">{formatMarketCap(company.market_cap)}</td>
                <td className="px-3 py-3.5"><ValuationBadge score={company.valuation_score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>全 {data.meta.total} 件</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPage(data.meta.page - 1)}
            disabled={data.meta.page <= 1 || isPending}
            className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40"
          >
            前へ
          </button>
          <span className="px-3 py-1.5">{data.meta.page} / {data.meta.total_pages}</span>
          <button
            onClick={() => loadPage(data.meta.page + 1)}
            disabled={data.meta.page >= data.meta.total_pages || isPending}
            className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
