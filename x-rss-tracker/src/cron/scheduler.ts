/**
 * cron/scheduler.ts
 * node-cronによるRSS定期取得スケジューラ
 * Next.jsのinstrumentation.tsから初期化する
 */
import cron from "node-cron";
import { processAllAccounts } from "@/lib/rss/processor";

let isSchedulerRunning = false;
let isJobRunning = false;

/**
 * 5分ごとのRSS取得ジョブを登録
 */
export function startScheduler(): void {
  if (isSchedulerRunning) {
    console.log("[Cron] スケジューラは既に起動しています");
    return;
  }

  const intervalMinutes =
    parseInt(process.env.CRON_INTERVAL_MINUTES ?? "5", 10) || 5;

  // cron式に変換 (例: 5分 → "*/5 * * * *")
  const cronExpression = `*/${intervalMinutes} * * * *`;
  console.log(`[Cron] スケジューラ起動: ${cronExpression} (${intervalMinutes}分ごと)`);

  cron.schedule(cronExpression, async () => {
    if (isJobRunning) {
      console.log("[Cron] 前のジョブが実行中のためスキップ");
      return;
    }

    isJobRunning = true;
    const startAt = new Date().toISOString();
    console.log(`[Cron] ジョブ開始: ${startAt}`);

    try {
      const results = await processAllAccounts();
      const totalNew = results.reduce((s, r) => s + r.newPosts, 0);
      console.log(`[Cron] ジョブ完了: 新規${totalNew}件 (${results.length}アカウント処理)`);
    } catch (err) {
      console.error("[Cron] ジョブエラー:", err);
    } finally {
      isJobRunning = false;
    }
  });

  isSchedulerRunning = true;
}

/**
 * 手動1回実行（テスト・デバッグ用）
 */
export async function runOnce(): Promise<void> {
  console.log("[Cron] 手動実行開始");
  const results = await processAllAccounts();
  const totalNew = results.reduce((s, r) => s + r.newPosts, 0);
  console.log("[Cron] 手動実行完了:", JSON.stringify(results, null, 2));
  console.log(`[Cron] 合計新規投稿: ${totalNew}件`);
}
