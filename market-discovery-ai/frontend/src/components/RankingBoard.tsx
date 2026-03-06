"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { fetchRanking } from "@/lib/api";
import type { RankingResponse, ThemeRankingItem } from "@/types";
import {
  getCompetitionLabel, getCompetitionColor, getCompetitionText,
  getBusinessIndexColor, getScoreBarColor,
} from "@/types";

interface Props { initialData: RankingResponse; categories: string[]; }

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  const pct = score ?? 0;
  return (
    <div className="flex items-center gap-1.5 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${getScoreBarColor(score)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500 w-7 text-right">{score?.toFixed(0) ?? "—"}</span>
    </div>
  );
}

function CompetitionMeter({ score }: { score: number | null }) {
  const label = getCompetitionLabel(score);
  const colorClass = getCompetitionColor(label);
  // 競合強度メーター: 5段階のセグメント表示
  const filled = score !== null ? Math.ceil((score / 100) * 5) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-2 h-3 rounded-sm ${
              i <= filled
                ? score! <= 30 ? "bg-emerald-500" : score! <= 60 ? "bg-yellow-500" : "bg-red-500"
                : "bg-gray-700"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${colorClass}`}>
        {getCompetitionText(label)}
      </span>
    </div>
  );
}

export function RankingBoard({ initialData, categories }: Props) {
  const [data, setData] = useState(initialData);
  const [category, setCategory] = useState("");
  const [lowCompOnly, setLowCompOnly] = useState(false);
  const [minIndex, setMinIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(opts?: { cat?: string; lowComp?: boolean; min?: number | null }) {
    const cat     = opts?.cat      ?? category;
    const lowComp = opts?.lowComp  ?? lowCompOnly;
    const min     = opts?.min      !== undefined ? opts.min : minIndex;
    startTransition(async () => {
      const res = await fetchRanking({
        per_page: 20,
        category: cat || undefined,
        max_competition: lowComp ? 50 : undefined,
        min_business_index: min ?? undefined,
      });
      setData(res);
    });
  }

  return (
    <div className={`transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}>
      {/* ── フィルターバー ── */}
      <div className="flex flex-wrap gap-3 mb-6 items-center bg-gray-900 p-4 rounded-xl border border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">フィルター</span>
        {/* カテゴリ */}
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); applyFilters({ cat: e.target.value }); }}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5"
        >
          <option value="">全カテゴリ</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* 低競合フィルター */}
        <button
          onClick={() => { const v = !lowCompOnly; setLowCompOnly(v); applyFilters({ lowComp: v }); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            lowCompOnly
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
          }`}
        >
          🟢 低競合のみ (競合≤50)
        </button>
        {/* 最低ビジネス指数 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">最低指数:</span>
          <input
            type="range" min="0" max="80" step="10"
            value={minIndex ?? 0}
            onChange={e => { const v = Number(e.target.value) || null; setMinIndex(v); applyFilters({ min: v }); }}
            className="w-20 accent-violet-500"
          />
          <span className="text-xs tabular-nums text-violet-400 w-6">{minIndex ?? 0}</span>
        </div>
        <span className="ml-auto text-xs text-gray-600">{data.meta.total}件</span>
      </div>

      {/* ── ランキングカード ── */}
      <div className="space-y-3">
        {data.data.length === 0 && (
          <div className="text-center py-20 text-gray-600">条件に合うテーマが見つかりません</div>
        )}
        {data.data.map((theme, i) => (
          <ThemeCard key={theme.id} theme={theme} rank={(data.meta.page - 1) * data.meta.per_page + i + 1} />
        ))}
      </div>

      {/* ── ページネーション ── */}
      <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
        <span>全 {data.meta.total} テーマ</span>
        <div className="flex gap-2">
          <button
            disabled={data.meta.page <= 1 || isPending}
            onClick={() => startTransition(async () => {
              setData(await fetchRanking({ page: data.meta.page - 1, per_page: 20, category: category || undefined }));
            })}
            className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700"
          >← 前</button>
          <span className="px-3 py-1.5">{data.meta.page}/{data.meta.total_pages}</span>
          <button
            disabled={data.meta.page >= data.meta.total_pages || isPending}
            onClick={() => startTransition(async () => {
              setData(await fetchRanking({ page: data.meta.page + 1, per_page: 20, category: category || undefined }));
            })}
            className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700"
          >次 →</button>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, rank }: { theme: ThemeRankingItem; rank: number }) {
  const compLabel = getCompetitionLabel(theme.competition_score);
  return (
    <Link href={`/theme/${theme.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-violet-500/40 hover:bg-gray-800/60 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl font-black text-gray-700 tabular-nums w-8 flex-shrink-0">
              {rank}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  {theme.category}
                </span>
                {(theme.biz_models ?? []).slice(0, 2).map(m => (
                  <span key={m} className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">
                    {m}
                  </span>
                ))}
              </div>
              <h3 className="font-bold text-gray-100 group-hover:text-violet-300 transition-colors line-clamp-1">
                {theme.title}
              </h3>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-black tabular-nums ${getBusinessIndexColor(theme.business_index)}`}>
              {theme.business_index?.toFixed(1) ?? "—"}
            </div>
            <div className="text-xs text-gray-600">ビジネス指数</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">📈 需要</div>
            <ScoreBar score={theme.demand_score} label="需要" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">💰 収益化</div>
            <ScoreBar score={theme.monetization_score} label="収益化" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">⚔️ 競合強度</div>
            <CompetitionMeter score={theme.competition_score} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">🛠 開発難易度</div>
            <ScoreBar score={theme.dev_difficulty_score} label="難易度" />
          </div>
        </div>

        {theme.top_keywords && theme.top_keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {theme.top_keywords.slice(0, 8).map(kw => (
              <span key={kw} className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
