import type { ReactNode } from "react";

import { OpportunityExplorer } from "@/components/OpportunityExplorer";
import {
  fetchRanking,
  fetchScreeningHistory,
  fetchSourceBackedOpportunities,
  type ScreeningRun,
  type SourceBackedOpportunity,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const APP_NAME = "Market Discovery AI";

export default async function HomePage() {
  const [rankingData, sourceData, historyData] = await Promise.all([
    fetchRanking({ per_page: 20 }),
    fetchSourceBackedOpportunities(),
    fetchScreeningHistory(),
  ]);

  const opportunities = sourceData.opportunities.slice().sort((a, b) => b.score - a.score);
  const autoDev = opportunities.filter((item) => item.stage === "auto_develop");
  const watch = opportunities.filter((item) => item.stage === "watch");
  const latestRun = historyData.runs[0];
  const latestAutoDevCandidates = latestRun?.newCandidates.filter((item) => item.stage === "auto_develop").slice(0, 6) ?? [];
  const generatedAt = formatDateTime(sourceData.generated_at);

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-stone-950">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fffdfa]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-stone-950 text-sm font-black text-white">
              MD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-teal-700">AI Company OS / 市場発見部門</p>
              <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{APP_NAME}</h1>
            </div>
          </div>
          <div className="hidden rounded-md border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 sm:block">
            更新: <span className="font-semibold text-stone-950">{generatedAt}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-5 md:px-8">
        <section className="rounded-lg border border-stone-200 bg-[#fffdfa] p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_430px] lg:items-center">
            <div>
              <p className="text-xs font-semibold text-teal-700">毎週新規探索 / 空き枠があれば自動開発へ投入</p>
              <h2 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">
                最新の需要シグナルを集め、スコア順にMVPからベータ準備まで流す画面
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                官公庁資料、業界団体、企業調査、規制変更、人手不足領域を横断して候補を拾い、買い手・営業ルート・収益モデル・検証条件までそろったものを上位に残します。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <MiniStat label="スコア済み母集団" value={String(opportunities.length)} />
              <MiniStat label="自動開発候補" value={String(autoDev.length)} />
              <MiniStat label="追加調査" value={String(watch.length)} />
              <MiniStat label="既存ランキング" value={String(rankingData.meta.total)} />
            </div>
          </div>
        </section>

        <PipelineLane active={autoDev.length} total={opportunities.length} />

        {latestRun ? (
          <section className="mt-5">
            <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold text-cyan-700">{latestRun.date} / {latestRun.label}</p>
                <h2 className="text-xl font-bold">今日の自動開発候補</h2>
              </div>
              <p className="max-w-2xl text-xs leading-5 text-stone-500">{latestRun.summary}</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {latestAutoDevCandidates.map((item) => (
                <DailyCandidateCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-5 grid gap-3 lg:grid-cols-4">
          <BriefCard
            title="探索"
            body="毎週の深掘りで候補を大量に拾い、今回は49件まで母集団を拡大しました。6時間ごとにキュー空きを確認します。"
          />
          <BriefCard
            title="採点"
            body="需要、支払い理由、競合、開発容易性、根拠の強さ、日本市場適合、営業ルートを横断評価します。"
          />
          <BriefCard
            title="自動開発"
            body="上位候補はMVP、自動テスト、AIレビュー、ベータ準備チェックを必須にして、空きがあれば順次投入します。"
          />
          <BriefCard
            title="営業仮説"
            body="候補ごとに直接営業先、紹介チャネル、価格、最初の検証条件を残し、使われる見込みが弱いものはWatchへ落とします。"
          />
        </section>

        <OpportunityExplorer opportunities={opportunities} runs={historyData.runs} />

        <section className="mt-6">
          <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-700">履歴</p>
              <h2 className="text-xl font-bold">スクリーニング履歴</h2>
            </div>
            <p className="text-xs text-stone-500">過去に見たソース、追加候補、キュー投入判断を追えるようにしています。</p>
          </div>
          <div className="grid gap-3">
            {historyData.runs.map((run) => (
              <HistoryRunCard key={`${run.date}-${run.label}`} run={run} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function PipelineLane({ active, total }: { active: number; total: number }) {
  const steps = [
    { label: "大量収集", value: `${total}件`, detail: "最新ソースを横断" },
    { label: "採点", value: "0-100", detail: "需要と収益を重視" },
    { label: "MVP", value: "上位順", detail: "ローカルで動く最小版" },
    { label: "自動テスト", value: "必須", detail: "スモーク・ビルド確認" },
    { label: "自動レビュー", value: "AI審査", detail: "安全性と品質を見る" },
    { label: "ベータ準備", value: `${active}件`, detail: "営業検証へ渡す" },
  ];

  return (
    <section className="mt-5 rounded-lg border border-stone-200 bg-[#fffdfa] p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-700">連続開発ライン</p>
          <h2 className="text-xl font-bold">上位候補からベータ準備まで止めずに進める</h2>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-stone-500">
          レビューや統合が詰まっている時は新規投入を抑え、空きができたら次の高スコア候補を自動投入します。
        </p>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => (
          <div key={step.label} className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-stone-950 text-xs font-black text-white">{index + 1}</span>
              <span className="text-xs font-semibold text-emerald-700">{step.value}</span>
            </div>
            <h3 className="mt-3 text-sm font-bold">{step.label}</h3>
            <p className="mt-1 text-xs leading-5 text-stone-600">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyCandidateCard({ item }: { item: SourceBackedOpportunity }) {
  return (
    <article className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={item.stage === "auto_develop" ? "green" : "amber"}>{stageText(item.stage)}</Badge>
          <h3 className="mt-2 text-base font-bold leading-6">{item.title}</h3>
          <p className="mt-1 text-xs text-stone-500">{item.segment}</p>
        </div>
        <div className="shrink-0 rounded-md bg-cyan-50 px-3 py-2 text-center">
          <div className="text-xl font-black tabular-nums text-cyan-700">{item.score}</div>
          <div className="text-[11px] text-cyan-900">score</div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{item.firstCut}</p>
      <div className="mt-3 rounded-md border border-cyan-100 bg-cyan-50 p-3 text-xs leading-5 text-cyan-950">
        <span className="font-semibold">期待値 {expectedText(item.commercial.expectedValue)}</span>
        <span className="mx-1">/</span>
        {item.commercial.revenueModel}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.sources.slice(0, 2).map((source) => (
          <a key={source.url} href={source.url} className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-600 hover:border-cyan-300 hover:text-cyan-800">
            {source.label}
          </a>
        ))}
      </div>
    </article>
  );
}

function HistoryRunCard({ run }: { run: ScreeningRun }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-[#fffdfa] p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal">{run.date}</Badge>
            <span className="text-sm font-bold">{run.label}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-600">{run.summary}</p>
          {run.skippedReason ? <p className="mt-2 text-xs leading-5 text-amber-800">{run.skippedReason}</p> : null}
        </div>
        <div className="grid min-w-48 grid-cols-2 gap-2 text-center">
          <SmallMetric label="新規" value={String(run.newCandidates.length)} />
          <SmallMetric label="投入候補" value={String(run.queuedSlugs.length)} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChipGroup title="見たソース" items={run.sourcesChecked} />
        <ChipGroup title="自動開発へ回すSlug" items={run.queuedSlugs.length ? run.queuedSlugs : ["空き枠待ち"]} />
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
      <div className="text-xs text-emerald-900">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums text-emerald-700">{value}</div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
      <div className="text-lg font-black tabular-nums text-stone-900">{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function BriefCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-[#fffdfa] p-4 shadow-sm">
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-stone-600">{body}</p>
    </article>
  );
}

function ChipGroup({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="text-xs font-semibold text-stone-500">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "green" | "amber" | "stone" | "teal" }) {
  const className = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    stone: "border-stone-200 bg-stone-100 text-stone-700",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
  }[tone];
  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function stageText(stage: SourceBackedOpportunity["stage"]) {
  if (stage === "auto_develop") return "自動開発へ投入";
  if (stage === "watch") return "追加調査";
  return "除外";
}

function expectedText(value: SourceBackedOpportunity["commercial"]["expectedValue"]) {
  if (value === "High") return "高";
  if (value === "Medium") return "中";
  return "低";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}
