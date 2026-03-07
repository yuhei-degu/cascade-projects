/**
 * POST /api/cron/trigger
 * Cronジョブを手動でトリガーするAPIエンドポイント
 * （テスト・デバッグ用）
 */
import { NextResponse } from "next/server";
import { processAllAccounts } from "@/lib/rss/processor";

export async function POST() {
  console.log("[API /api/cron/trigger] 手動RSS取得を開始");
  const startAt = Date.now();

  try {
    const results = await processAllAccounts();
    const totalNew = results.reduce((s, r) => s + r.newPosts, 0);
    const durationMs = Date.now() - startAt;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalNew,
          totalAccounts: results.length,
          durationMs,
        },
      },
    });
  } catch (err) {
    console.error("[API /api/cron/trigger] Error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
