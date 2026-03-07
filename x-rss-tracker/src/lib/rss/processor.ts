/**
 * lib/rss/processor.ts
 * RSS取得結果をDBへ保存する（重複チェック込み）
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
 * - エラー時はFetchLogにエラー記録して継続
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
    // 既存URLを一括取得（個別クエリを避けてN+1解消）
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

    // 新規投稿のみ抽出
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
        skipDuplicates: true, // 念のため二重保険
      });
      console.log(`[Processor] @${username}: ${newPosts}件を新規保存`);
    } else {
      console.log(`[Processor] @${username}: 新規投稿なし`);
    }
  }

  const durationMs = Date.now() - startAt;

  // FetchLog記録
  await prisma.fetchLog.create({
    data: {
      accountId,
      username,
      status: error ? "error" : "success",
      newPosts,
      totalPosts,
      errorMsg: error ?? null,
      durationMs,
    },
  });

  // TrackedAccount の lastFetchAt / fetchError を更新
  await prisma.trackedAccount.update({
    where: { id: accountId },
    data: {
      lastFetchAt: new Date(),
      fetchError: error ?? null,
    },
  });

  return { username, newPosts, totalPosts, durationMs, error };
}

/**
 * 全アクティブアカウントを順次処理
 * エラーが出ても次のアカウントに継続する
 */
export async function processAllAccounts(): Promise<ProcessResult[]> {
  const accounts = await prisma.trackedAccount.findMany({
    where: { isActive: true },
    orderBy: { username: "asc" },
  });

  console.log(`[Processor] ${accounts.length}アカウントのRSS取得を開始`);

  const results: ProcessResult[] = [];
  for (const account of accounts) {
    const result = await processAccount(account.id, account.username);
    results.push(result);
  }

  const totalNew = results.reduce((s, r) => s + r.newPosts, 0);
  console.log(`[Processor] 完了: 新規${totalNew}件保存`);

  return results;
}
