import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCompanyDetail } from "@/lib/api";
import { formatMarketCap, formatPercent, getValuationColorClass, getValuationLabel } from "@/types";
import type { AIScore, FinancialMetric, ValuationLabel } from "@/types";

interface Props {
  params: { ticker: string };
}

const valuationText: Record<ValuationLabel, string> = {
  very_cheap: "かなり割安",
  cheap: "割安",
  fair: "妥当",
  expensive: "割高",
  unknown: "不明",
};

function displayScore(value: number | null | undefined, digits = 1) {
  return value === null || value === undefined ? "-" : value.toFixed(digits);
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
  const financials = company.latest_financials;
  const valuationLabel = getValuationLabel(score?.valuation_score ?? company.valuation_score);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <Link href="/" className="text-sm font-semibold text-cyan-300 hover:underline">
          ← ランキングへ戻る
        </Link>
      </div>

      <header className="mx-auto max-w-5xl px-4 pb-8 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-4xl font-black text-cyan-300">{company.ticker}</span>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getValuationColorClass(valuationLabel)}`}>
                {valuationText[valuationLabel]}
              </span>
              {company.exchange && (
                <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">{company.exchange}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-100 md:text-4xl">{company.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{company.sector ?? "テーマ未設定"} / {company.industry ?? "業種未設定"}</p>
            {company.description && (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{company.description}</p>
            )}
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-right">
            <span className="block text-xs text-cyan-300">総合スコア</span>
            <strong className="text-4xl text-cyan-100">{displayScore(score?.composite_score ?? company.composite_score)}</strong>
            <span className="mt-3 block text-xs text-cyan-300">時価総額</span>
            <strong>{formatMarketCap(company.market_cap)}</strong>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-2">
        {score && <ScoreBreakdownCard score={score} />}
        {financials && <FinancialMetricsCard financials={financials} />}
        <PatentStatsCard total={company.patent_count} aiRelated={company.ai_patent_count} />
        <ValuationCard score={score} />
      </div>
    </main>
  );
}

function ScoreBreakdownCard({ score }: { score: AIScore }) {
  const components = [
    { label: "総合", value: score.composite_score, color: "bg-cyan-400" },
    { label: "技術力", value: score.tech_score, color: "bg-blue-400" },
    { label: "成長性", value: score.growth_score, color: "bg-violet-400" },
    { label: "収益性", value: score.profitability_score, color: "bg-amber-400" },
  ];

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-base font-bold text-slate-100">AIスコア内訳</h2>
      <div className="space-y-4">
        {components.map((component) => (
          <div key={component.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-400">{component.label}</span>
              <span className="font-mono font-semibold text-slate-100">{displayScore(component.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className={`h-full rounded-full ${component.color}`} style={{ width: `${component.value ?? 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinancialMetricsCard({ financials }: { financials: FinancialMetric }) {
  const metrics = [
    { label: "PER", value: displayScore(financials.per) },
    { label: "PEG", value: displayScore(financials.peg, 2) },
    { label: "売上成長", value: formatPercent(financials.revenue_yoy) },
    { label: "EPS成長", value: formatPercent(financials.eps_growth_yoy) },
    { label: "粗利率", value: formatPercent(financials.gross_margin) },
    { label: "営業利益率", value: formatPercent(financials.operating_margin) },
    { label: "FCFマージン", value: formatPercent(financials.fcf_margin) },
    { label: "研究開発比率", value: formatPercent(financials.rd_ratio) },
  ];

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-base font-bold text-slate-100">財務・バリュエーション</h2>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="block text-xs text-slate-500">{metric.label}</span>
            <strong className="mt-1 block font-mono text-slate-100">{metric.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PatentStatsCard({ total, aiRelated }: { total: number; aiRelated: number }) {
  const ratio = total > 0 ? (aiRelated / total) * 100 : 0;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-base font-bold text-slate-100">技術シグナル</h2>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-slate-950 p-4 text-center">
          <strong className="block text-3xl text-blue-300">{total}</strong>
          <span className="text-xs text-slate-500">推定特許</span>
        </div>
        <div className="rounded-lg bg-slate-950 p-4 text-center">
          <strong className="block text-3xl text-emerald-300">{aiRelated}</strong>
          <span className="text-xs text-slate-500">AI関連</span>
        </div>
      </div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>AI関連比率</span>
        <span>{ratio.toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, ratio)}%` }} />
      </div>
    </section>
  );
}

function ValuationCard({ score }: { score: AIScore | null }) {
  const value = score?.valuation_score ?? null;
  const text =
    value === null ? "評価データが不足しています。" :
    value >= 5 ? "割安感がかなり強い候補です。ただし需給や業績鈍化リスクの確認が必要です。" :
    value >= 2.5 ? "割安寄りです。成長テーマと収益性が続くかを重点確認します。" :
    value >= 1 ? "おおむね妥当です。ここからの上昇には追加の成長材料が必要です。" :
    "割高寄りです。短期の期待が先行していないか確認します。";

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-base font-bold text-slate-100">一次判断メモ</h2>
      <div className="mb-4 text-center">
        <span className="block text-xs text-slate-500">割安スコア</span>
        <strong className="text-4xl text-amber-300">{displayScore(value, 2)}</strong>
      </div>
      <p className="text-sm leading-7 text-slate-300">{text}</p>
      <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-6 text-amber-100">
        これは投資助言ではなく、調査候補を並べるための画面です。購入判断には最新決算、開示資料、株価水準を必ず確認してください。
      </p>
    </section>
  );
}
