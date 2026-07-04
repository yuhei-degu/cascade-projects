import { Suspense } from "react";
import { RankingTable } from "@/components/RankingTable";
import { fetchRanking } from "@/lib/api";

export const revalidate = 3600;

export default async function HomePage() {
  const rankingData = await fetchRanking({ per_page: 20 });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-cyan-300">AI STOCK RADAR</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">AIテンバガー候補ランキング</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              技術力、成長性、収益性、割安感を並べて確認します。API停止時はデモ銘柄を表示するため、
              画面の確認と比較作業を止めません。
            </p>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            <span className="block text-xs text-cyan-300">評価日</span>
            <strong>{rankingData.score_date}</strong>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<RankingTableSkeleton />}>
          <RankingTable initialData={rankingData} />
        </Suspense>
      </div>
    </main>
  );
}

function RankingTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-slate-800" />
      ))}
    </div>
  );
}
