/**
 * テーマ詳細ページ — /theme/[id]
 * 収益化ポテンシャル内訳 / 競合強度メーター / キーワードリスト
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchThemeDetail } from "@/lib/api";
import type { BusinessScore } from "@/types";
import {
  getCompetitionLabel, getCompetitionColor, getCompetitionText, getScoreBarColor,
} from "@/types";

interface Props { params: { id: string } }

export default async function ThemeDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  let res;
  try { res = await fetchThemeDetail(id); } catch { notFound(); }
  const theme = res.data;
  const score = theme.score;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/" className="text-sm text-violet-400 hover:underline">← ランキングへ</Link>

        {/* ヘッダー */}
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
              {theme.category}
            </span>
            {(theme.biz_models ?? []).map(m => (
              <span key={m} className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
                {m}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-black text-gray-100">{theme.title}</h1>
          {theme.description && <p className="mt-2 text-gray-400 text-sm">{theme.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ビジネス指数サマリー */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">📊 総合ビジネス指数</h2>
            <div className="text-5xl font-black text-violet-400 mb-2">
              {score?.business_index?.toFixed(1) ?? "—"}
            </div>
            <p className="text-xs text-gray-500 mb-5">= 0.4×需要 + 0.3×収益化 + 0.2×(1-競合) + 0.1×(1-難易度)</p>
            {score && (
              <div className="space-y-3">
                {[
                  { label: "📈 需要スコア",      score: score.demand_score,         weight: "40%" },
                  { label: "💰 収益化可能性",    score: score.monetization_score,   weight: "30%" },
                  { label: "⚔️ 競合強度 (逆)",   score: score.competition_score != null ? 100 - score.competition_score : null, weight: "20%" },
                  { label: "🛠 開発難易度 (逆)", score: score.dev_difficulty_score != null ? 100 - score.dev_difficulty_score : null, weight: "10%" },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="text-gray-600">{row.weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreBarColor(row.score)}`} style={{ width: `${row.score ?? 0}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-gray-400 w-8 text-right">{row.score?.toFixed(0) ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 収益化ポテンシャル内訳 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">💰 収益化ポテンシャル内訳</h2>
            {score?.monetization_detail ? (
              <div className="space-y-3">
                {[
                  { label: "お金ワード頻度",  score: score.monetization_detail.money_word_score },
                  { label: "課金意欲",        score: score.monetization_detail.purchase_intent_score },
                  { label: "緊急度",          score: score.monetization_detail.urgency_score },
                  { label: "問題深刻度",      score: score.monetization_detail.severity_score },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="tabular-nums text-yellow-400">{row.score?.toFixed(0) ?? "—"}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${row.score ?? 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-600 text-sm">データなし</p>}

            {/* 競合強度メーター */}
            <h2 className="font-bold mt-5 mb-3 text-sm text-gray-400 uppercase tracking-wider">⚔️ 競合強度メーター</h2>
            {score && <CompetitionMeterDetail score={score} />}
          </div>

          {/* 投稿統計 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">📋 投稿統計</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-black text-blue-400">{theme.post_count}</div>
                <div className="text-xs text-gray-500">投稿数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-violet-400">{theme.comment_count_total}</div>
                <div className="text-xs text-gray-500">コメント数</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-black ${theme.post_growth_rate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {theme.post_growth_rate >= 0 ? "+" : ""}{(theme.post_growth_rate * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">投稿増加率</div>
              </div>
            </div>
          </div>

          {/* キーワード */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm text-gray-400 uppercase tracking-wider">🔑 関連キーワード</h2>
            <div className="flex flex-wrap gap-1.5">
              {(theme.keywords_list ?? theme.top_keywords?.map(w => ({ word: w, tfidf_score: 1, is_monetization: false })) ?? [])
                .slice(0, 20).map((k: {word:string;is_monetization:boolean}) => (
                <span
                  key={k.word}
                  className={`text-xs px-2 py-0.5 rounded border ${
                    k.is_monetization
                      ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  }`}
                >
                  {k.is_monetization && "💰 "}{k.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CompetitionMeterDetail({ score }: { score: BusinessScore }) {
  const label = getCompetitionLabel(score.competition_score);
  const colorClass = getCompetitionColor(label);
  const filled = score.competition_score !== null ? Math.ceil((score.competition_score / 100) * 10) : 0;
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`flex-1 h-4 rounded-sm ${
            i < filled
              ? score.competition_score! <= 30 ? "bg-emerald-500" : score.competition_score! <= 60 ? "bg-yellow-500" : "bg-red-500"
              : "bg-gray-800"
          }`} />
        ))}
      </div>
      <div className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${colorClass}`}>
        {getCompetitionText(label)} (スコア: {score.competition_score?.toFixed(0) ?? "—"})
      </div>
      {score.competition_detail && (
        <div className="mt-3 space-y-1.5 text-xs text-gray-500">
          <div className="flex justify-between"><span>検索量推定</span><span className="tabular-nums">{score.competition_detail.search_volume_score?.toFixed(0)}</span></div>
          <div className="flex justify-between"><span>既存アプリ推定</span><span className="tabular-nums">{score.competition_detail.app_exists_score?.toFixed(0)}</span></div>
          <div className="flex justify-between"><span>広告出稿推定</span><span className="tabular-nums">{score.competition_detail.ad_spend_score?.toFixed(0)}</span></div>
        </div>
      )}
    </div>
  );
}
