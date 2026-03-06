/**
 * ⑯ メインランキングページ（SSR/ISR）
 */
import { Suspense } from "react";
import { fetchRanking, fetchCategories } from "@/lib/api";
import { RankingBoard } from "@/components/RankingBoard";

export const revalidate = 3600;

export default async function HomePage() {
  const [rankingData, catData] = await Promise.all([
    fetchRanking({ per_page: 20 }),
    fetchCategories(),
  ]);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight">
              🔍 <span className="text-violet-400">Market</span> Discovery AI
            </h1>
            <p className="text-xs text-gray-500">個人が勝てる市場を発見するエンジン</p>
          </div>
          <span className="text-xs text-gray-600 hidden sm:block">
            基準日: {rankingData.score_date}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="animate-pulse space-y-3">{Array.from({length:8}).map((_,i)=><div key={i} className="h-20 bg-gray-800 rounded-xl"/>)}</div>}>
          <RankingBoard initialData={rankingData} categories={catData.categories} />
        </Suspense>
      </div>
    </main>
  );
}
