/**
 * instrumentation.ts (Next.js 14 Instrumentation Hook)
 * サーバー起動時に1回だけ実行される → ここでCronを初期化
 *
 * next.config.js で instrumentationHook: true が必要
 */
export async function register() {
  // サーバーサイドのみ（EdgeランタイムはNode.js APIが使えないので除外）
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/cron/scheduler");
    startScheduler();
    console.log("[Instrumentation] Cronスケジューラ起動完了");
  }
}
