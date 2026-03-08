/**
 * lib/rss/processor.ts
 * RSS取得結果をDBへ保存する（重複チェック込み）
 * v2: 全アカウントを Promise.allSettled で並列処理
 */
import { prisma } from "@/lib/db/client";
import { fetchRssByUsername } from "@/lib/rss/fetcher";

export interface ProcessResult {
  username: string;
  newPosts: number;
  totalPosts: number;
  durationMs: number;
  error?: string;
}

/**
 * 1アカウント分のRSS取得→DB保存を実行
 * - URLをユニークキーとして重複チェック
 * - エラー時はFetchLogに記録して継続
 */
export async function processAccount(
  accountId: string,
  username: string
): Promise<ProcessResult> {
  const startAt = Date.now();

  const { items, error } = await fetchRssByUsername(username);
  const totalPosts = items.length;
  let newPosts = 0;

  if (!error && items.length > 0) {
    // 既存URLを一括取得（N+1解消）
    const existingUrls = new Set(
      (
        await prisma.post.findMany({
          where: {
            accountId,
            url: { in: items.map((i) => i.url) },
          },
          select: { url: true },
        })
      ).map((p) => p.url)
    );

    const newItems = items.filter((item) => !existingUrls.has(item.url));
    newPosts = newItems.length;

    if (newItems.length > 0) {
      await prisma.post.createMany({
        data: newItems.map((item) => ({
          accountId,
          title: item.title,
          content: item.content,
          url: item.url,
          publishedAt: item.publishedAt,
        })),
        skipDuplicates: true,
      });
      console.log(`[Processor] @${username}: ${newPosts}件を新規保存`);
    } else {
      console.log(`[Processor] @${username}: 新規投稿なし`);
    }
  }

  const durationMs = Date.now() - startAt;

  // FetchLog記録 & Account更新を並列実行
  await Promise.all([
    prisma.fetchLog.create({
      data: {
        accountId,
        username,
        status: error ? "error" : "success",
        newPosts,
        totalPosts,
        errorMsg: error ?? null,
        durationMs,
      },
    }),
    prisma.trackedAccount.update({
      where: { id: accountId },
      data: {
        lastFetchAt: new Date(),
        fetchError: error ?? null,
      },
    }),
  ]);

  return { username, newPosts, totalPosts, durationMs, error };
}
/**
 * processAllAccounts — 全アカウントを並列処理（Promise.allSettled）
 * - 1アカウントのエラーが他に影響しない
 * - 全アカウントを同時にRSS取得 → 大幅な速度向上
 * - PARALLEL_LIMIT で同時実行数を制限（RSSサーバー負荷対策）
 */
const PARALLEL_LIMIT = parseInt(process.env.RSS_PARALLEL_LIMIT ?? "3", 10);

/**
 * 配列をチャンク分割して順次並列実行
 * 例: 9アカウント・LIMIT=3 → [3件, 3件, 3件] と3バッチで処理
 */
async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<ProcessResult>
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        results.push(r.value);
      } else {
        // reject はほぼ起きないが念のため
        console.error("[Processor] 予期しないエラー:", r.reason);
        results.push({
          username: "unknown",
          newPosts: 0,
          totalPosts: 0,
          durationMs: 0,
          error: String(r.reason),
        });
      }
    }
    if (i + batchSize < items.length) {
      // バッチ間に少し間隔を入れてサーバー負荷軽減
      await new Promise((res) => setTimeout(res, 500));
    }
  }
  return results;
}

export async function processAllAccounts(): Promise<ProcessResult[]> {
  const accounts = await prisma.trackedAccount.findMany({
    where: { isActive: true },
    orderBy: { username: "asc" },
  });

  if (accounts.length === 0) {
    console.log("[Processor] 監視アカウントが0件です");
    return [];
  }

  console.log(
    `[Processor] ${accounts.length}アカウントを並列処理開始` +
    ` (並列数: ${PARALLEL_LIMIT})`
  );

  const results = await runInBatches(
    accounts,
    PARALLEL_LIMIT,
    (acc) => processAccount(acc.id, acc.username)
  );

  const totalNew = results.reduce((s, r) => s + r.newPosts, 0);
  const errors   = results.filter((r) => r.error).length;
  console.log(
    `[Processor] 完了: 新規${totalNew}件保存` +
    (errors > 0 ? ` / エラー${errors}件` : "")
  );

  return results;
}
