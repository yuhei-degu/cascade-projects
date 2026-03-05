/**
 * ⑦ メインランキングページ (Next.js App Router)
 *
 * サーバーサイドで初期データを取得し、
 * クライアントコンポーネントにバケツリレーする。
 */

import { Suspense } from "react";
import { fetchRanking } from "@/lib/api";
import { RankingTable } from "@/components/RankingTable";
import { PageHeader } from "@/components/ui/PageHeader";

export const revalidate = 3600; // 1時間ごとにISR再生成

export default async function HomePage() {
  // サーバーサイドでデータ取得（SSR/ISR）
  const rankingData = await fetchRanking({ per_page: 20 });

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* ヘッダー */}
      <PageHeader
        title="AI 割安株ランキング"
        subtitle={`技術力 × 成長性 × 収益性 × バリュエーション統合スコア | ${rankingData.score_date} 時点`}
      />

      {/* ランキングテーブル */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<RankingTableSkeleton />}>
          <RankingTable initialData={rankingData} />
        </Suspense>
      </div>
    </main>
  );
}

/** ローディングスケルトン */
function RankingTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-800 rounded-lg" />
      ))}
    </div>
  );
}
