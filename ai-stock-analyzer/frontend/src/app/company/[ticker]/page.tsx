/**
 * 企業詳細ページ (Next.js App Router)
 * /company/[ticker] — 企業のスコア内訳・財務指標を表示
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchCompanyDetail } from "@/lib/api";
import {
  getValuationLabel,
  getValuationColorClass,
  formatMarketCap,
  formatPercent,
} from "@/types";
import type { AIScore } from "@/types";

interface Props {
  params: { ticker: string };
}

export default async function CompanyDetailPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase();

  let response;
  try {
    response = await fetchCompanyDetail(ticker);
  } catch {
    notFound();
  }

  const company = response.data;
  const score = company.latest_score;
  const fin = company.latest_financials;

  const valuationLabel = getValuationLabel(score?.valuation_score ?? null);
  const valuationColor = getValuationColorClass(valuationLabel);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* ナビゲーション */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link href="/" className="text-sm text-blue-400 hover:underline">← ランキングに戻る</Link>
      </div>

      {/* ヘッダー */}
      <header className="max-w-5xl mx-auto px-4 pt-6 pb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-3xl font-black text-blue-400">{company.ticker}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${valuationColor}`}>
                {valuationLabel === "very_cheap" ? "激安" : valuationLabel === "cheap" ? "割安" : valuationLabel === "fair" ? "適正" : "割高"}
              </span>
              {company.exchange && (
                <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{company.exchange}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-100">{company.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{company.sector} / {company.industry}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">
              {score?.composite_score?.toFixed(1) ?? "—"}
            </div>
            <div className="text-xs text-gray-500">AI総合スコア</div>
            <div className="text-lg font-semibold text-yellow-400 mt-1">
              {score?.valuation_score?.toFixed(2) ?? "—"}
            </div>
            <div className="text-xs text-gray-500">割安スコア</div>
          </div>
        </div>
        {company.description && (
          <p className="mt-4 text-gray-400 text-sm leading-relaxed line-clamp-3">{company.description}</p>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI スコア内訳 */}
        {score && <ScoreBreakdownCard score={score} />}

        {/* 財務指標 */}
        {fin && <FinancialMetricsCard fin={fin} />}

        {/* 特許統計 */}
        <PatentStatsCard
          total={company.patent_count}
          aiRelated={company.ai_patent_count}
        />

        {/* バリュエーション */}
        <ValuationCard score={score} />
      </div>
    </main>
  );
}

/** スコア内訳カード */
function ScoreBreakdownCard({ score }: { score: AIScore }) {
  const components = [
    { label: "AI総合スコア",  value: score.composite_score,      color: "text-emerald-400", weight: null },
    { label: "技術力 (40%)", value: score.tech_score,            color: "text-blue-400",    weight: 0.4 },
    { label: "成長性 (30%)", value: score.growth_score,          color: "text-violet-400",  weight: 0.3 },
    { label: "収益性 (30%)", value: score.profitability_score,   color: "text-amber-400",   weight: 0.3 },
  ];
  const subs = [
    { label: "AIキーワード",   value: score.breakdown?.keyword_score },
    { label: "特許スコア",     value: score.breakdown?.patent_score },
    { label: "R&D比率",       value: score.breakdown?.rd_ratio_score },
    { label: "論文関連性",     value: score.breakdown?.paper_score },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-bold text-gray-200 mb-4 text-base">📊 AIスコア内訳</h2>
      <div className="space-y-3">
        {components.map((c) => (
          <div key={c.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{c.label}</span>
              <span className={`font-mono font-semibold ${c.color}`}>
                {c.value?.toFixed(1) ?? "—"}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  c.color.replace("text-", "bg-")
                }`}
                style={{ width: `${c.value ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <hr className="border-gray-800 my-4" />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">技術力 サブスコア</h3>
      <div className="grid grid-cols-2 gap-2">
        {subs.map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-gray-200">{s.value?.toFixed(1) ?? "—"}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 財務指標カード */
function FinancialMetricsCard({ fin }: { fin: NonNullable<typeof fin> }) {
  const metrics = [
    { label: "PER",        value: fin.per?.toFixed(1) ?? "—" },
    { label: "PEG",        value: fin.peg?.toFixed(2) ?? "—" },
    { label: "EV/EBITDA",  value: fin.ev_ebitda?.toFixed(1) ?? "—" },
    { label: "P/B",        value: fin.pb_ratio?.toFixed(2) ?? "—" },
    { label: "P/S",        value: fin.ps_ratio?.toFixed(2) ?? "—" },
    { label: "売上成長",   value: formatPercent(fin.revenue_yoy) },
    { label: "EPS成長",    value: formatPercent(fin.eps_growth_yoy) },
    { label: "粗利率",     value: formatPercent(fin.gross_margin) },
    { label: "営業利益率", value: formatPercent(fin.operating_margin) },
    { label: "純利益率",   value: formatPercent(fin.net_margin) },
    { label: "FCFマージン",value: formatPercent(fin.fcf_margin) },
    { label: "R&D比率",   value: formatPercent(fin.rd_ratio) },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-bold text-gray-200 mb-4 text-base">💹 財務指標</h2>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between items-center py-1.5 border-b border-gray-800/50">
            <span className="text-gray-500 text-xs">{m.label}</span>
            <span className="text-gray-200 font-mono text-sm font-semibold">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 特許統計カード */
function PatentStatsCard({ total, aiRelated }: { total: number; aiRelated: number }) {
  const ratio = total > 0 ? (aiRelated / total) * 100 : 0;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-bold text-gray-200 mb-4 text-base">🔬 特許統計</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-black text-blue-400">{total}</div>
          <div className="text-xs text-gray-500">総特許件数</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-emerald-400">{aiRelated}</div>
          <div className="text-xs text-gray-500">AI関連特許</div>
        </div>
      </div>
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>AI特許比率</span><span>{ratio.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

/** バリュエーションカード */
function ValuationCard({ score }: { score: AIScore | null }) {
  const valScore = score?.valuation_score;
  const interpretation =
    valScore === null || valScore === undefined ? "データ不足"
    : valScore >= 5 ? "非常に割安 — AI技術力に対してバリュエーションが低い"
    : valScore >= 2.5 ? "割安 — 成長ポテンシャルが株価に反映されていない可能性あり"
    : valScore >= 1 ? "適正 — 市場評価は妥当な水準"
    : "割高 — 現在の株価には成長期待が十分折り込まれている";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="font-bold text-gray-200 mb-4 text-base">⚖️ 割安判定</h2>
      <div className="text-center mb-4">
        <div className="text-4xl font-black text-yellow-400">
          {valScore?.toFixed(2) ?? "—"}
        </div>
        <div className="text-xs text-gray-500 mt-1">割安スコア</div>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{interpretation}</p>
      <div className="mt-4 pt-4 border-t border-gray-800 space-y-1 text-xs text-gray-500">
        <div className="flex justify-between"><span>使用PER</span><span className="font-mono">{score?.per_used?.toFixed(1) ?? "—"}</span></div>
        <div className="flex justify-between"><span>使用PEG</span><span className="font-mono">{score?.peg_used?.toFixed(2) ?? "—"}</span></div>
        <div className="flex justify-between"><span>モデルバージョン</span><span className="font-mono">{score?.model_version ?? "—"}</span></div>
      </div>
    </div>
  );
}
