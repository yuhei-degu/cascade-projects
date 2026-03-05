/**
 * ランキングテーブル — クライアントコンポーネント
 *
 * 企業ランキングをテーブル形式で表示する。
 * ソート・フィルター・ページネーション対応。
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fetchRanking } from "@/lib/api";
import type { CompanyRankingItem, RankingResponse, ValuationLabel } from "@/types";
import {
  getValuationLabel,
  getValuationColorClass,
  getScoreBarColor,
  formatMarketCap,
} from "@/types";

interface Props {
  initialData: RankingResponse;
}

/** スコアバー（0-100 の視覚的表現） */
function ScoreBar({ score, label }: { score: number | null; label: string }) {
  const pct = score ?? 0;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-gray-400 w-8 text-right">
        {score !== null ? score.toFixed(1) : "—"}
      </span>
    </div>
  );
}

/** 割安度バッジ */
function ValuationBadge({ score }: { score: number | null }) {
  const label = getValuationLabel(score);
  const colorClass = getValuationColorClass(label);
  const labelText: Record<ValuationLabel, string> = {
    very_cheap: "激安",
    cheap:      "割安",
    fair:       "適正",
    expensive:  "割高",
    unknown:    "—",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {labelText[label]}
    </span>
  );
}

/** ソートアイコン */
function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <span className="text-gray-600 ml-1">↕</span>;
  return <span className="text-blue-400 ml-1">{direction === "desc" ? "↓" : "↑"}</span>;
}

export function RankingTable({ initialData }: Props) {
  const [data, setData] = useState<RankingResponse>(initialData);
  const [sortKey, setSortKey] = useState<keyof CompanyRankingItem>("valuation_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sectorFilter, setSectorFilter] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // クライアントサイドソート
  const sorted = [...data.data].sort((a, b) => {
    const av = (a[sortKey] as number | null) ?? -Infinity;
    const bv = (b[sortKey] as number | null) ?? -Infinity;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  // セクターユニーク一覧
  const sectors = Array.from(new Set(data.data.map((c) => c.sector).filter(Boolean)));

  const filteredData = sectorFilter
    ? sorted.filter((c) => c.sector === sectorFilter)
    : sorted;

  function handleSort(key: keyof CompanyRankingItem) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function loadPage(page: number) {
    startTransition(async () => {
      const newData = await fetchRanking({ page, per_page: 20, sector: sectorFilter || undefined });
      setData(newData);
    });
  }

  const cols: { key: keyof CompanyRankingItem; label: string; numeric?: boolean }[] = [
    { key: "ticker",           label: "ティッカー" },
    { key: "name",             label: "企業名" },
    { key: "sector",           label: "セクター" },
    { key: "valuation_score",  label: "割安スコア", numeric: true },
    { key: "composite_score",  label: "AI総合",     numeric: true },
    { key: "tech_score",       label: "技術力",     numeric: true },
    { key: "growth_score",     label: "成長性",     numeric: true },
    { key: "profitability_score", label: "収益性",  numeric: true },
    { key: "per",              label: "PER",        numeric: true },
    { key: "peg",              label: "PEG",        numeric: true },
    { key: "market_cap",       label: "時価総額",   numeric: true },
  ];

  return (
    <div className={`transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}>
      {/* フィルターバー */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <span className="text-sm text-gray-400">セクター:</span>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">すべて</option>
          {sectors.map((s) => (
            <option key={s} value={s!}>{s}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500 ml-auto">
          {filteredData.length}社 | スコア基準日: {data.score_date}
        </span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              <th className="px-3 py-3 text-left text-gray-500 font-semibold w-8">#</th>
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-3 text-left text-gray-400 font-semibold cursor-pointer hover:text-gray-200 select-none whitespace-nowrap"
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} direction={sortDir} />
                </th>
              ))}
              <th className="px-3 py-3 text-left text-gray-400 font-semibold">割安度</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((company, index) => (
              <tr
                key={company.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors"
              >
                <td className="px-3 py-3.5 text-gray-600 font-mono text-xs">{index + 1}</td>
                <td className="px-3 py-3.5 font-mono font-bold text-blue-400">
                  <Link href={`/company/${company.ticker}`} className="hover:underline">
                    {company.ticker}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-gray-200 max-w-[200px] truncate">
                  <Link href={`/company/${company.ticker}`} className="hover:text-blue-300">
                    {company.name}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                  {company.sector ?? "—"}
                </td>
                <td className="px-3 py-3.5">
                  <ScoreBar score={company.valuation_score !== null ? Math.min(company.valuation_score * 10, 100) : null} label="割安" />
                </td>
                <td className="px-3 py-3.5">
                  <ScoreBar score={company.composite_score} label="総合" />
                </td>
                <td className="px-3 py-3.5">
                  <ScoreBar score={company.tech_score} label="技術" />
                </td>
                <td className="px-3 py-3.5">
                  <ScoreBar score={company.growth_score} label="成長" />
                </td>
                <td className="px-3 py-3.5">
                  <ScoreBar score={company.profitability_score} label="収益" />
                </td>
                <td className="px-3 py-3.5 text-gray-300 tabular-nums">
                  {company.per !== null ? company.per.toFixed(1) : "—"}
                </td>
                <td className="px-3 py-3.5 text-gray-300 tabular-nums">
                  {company.peg !== null ? company.peg.toFixed(2) : "—"}
                </td>
                <td className="px-3 py-3.5 text-gray-400 tabular-nums text-xs">
                  {formatMarketCap(company.market_cap)}
                </td>
                <td className="px-3 py-3.5">
                  <ValuationBadge score={company.valuation_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
        <span>全 {data.meta.total} 社</span>
        <div className="flex gap-2">
          <button
            onClick={() => loadPage(data.meta.page - 1)}
            disabled={data.meta.page <= 1 || isPending}
            className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700"
          >
            ← 前
          </button>
          <span className="px-3 py-1.5">{data.meta.page} / {data.meta.total_pages}</span>
          <button
            onClick={() => loadPage(data.meta.page + 1)}
            disabled={data.meta.page >= data.meta.total_pages || isPending}
            className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700"
          >
            次 →
          </button>
        </div>
      </div>
    </div>
  );
}
