/**
 * lib/rss/fetcher.ts
 * RSS取得・パースロジック（rss-parserラッパー）
 */
import Parser from "rss-parser";

export interface RssItem {
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
}

export interface FetchResult {
  username: string;
  items: RssItem[];
  error?: string;
}

// rss-parserインスタンス（カスタムフィールド対応）
const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["description", "description"],
    ],
  },
  timeout: 10000, // 10秒タイムアウト
  headers: {
    "User-Agent": "X-RSS-Tracker/1.0 (+https://github.com/yourname/x-rss-tracker)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

/**
 * RSS URLを組み立てる
 * 環境変数 RSS_BRIDGE_BASE_URL で切り替え可能
 */
export function buildRssUrl(username: string): string {
  const base =
    process.env.RSS_BRIDGE_BASE_URL?.trim() ?? "https://nitter.net";

  // rsshub.app 形式: https://rsshub.app/twitter/user/{username}
  if (base.includes("rsshub.app")) {
    return `${base.replace(/\/$/, "")}/${username}`;
  }

  // nitter 形式: https://nitter.net/{username}/rss
  return `${base.replace(/\/$/, "")}/${username}/rss`;
}

/**
 * RSS itemからcontentを抽出（フォールバック付き）
 */
function extractContent(item: Parser.Item & { contentEncoded?: string }): string {
  return (
    item.contentEncoded ??
    item.content ??
    (item as any).description ??
    item.title ??
    ""
  );
}

/**
 * RSS itemからURLを抽出（フォールバック付き）
 */
function extractUrl(item: Parser.Item): string {
  return item.link ?? item.guid ?? item.id ?? "";
}

/**
 * RSS itemからpublishedAtを抽出
 */
function extractPublishedAt(item: Parser.Item): Date {
  if (item.isoDate) return new Date(item.isoDate);
  if (item.pubDate) return new Date(item.pubDate);
  return new Date();
}

/**
 * 指定ユーザーのRSSを取得してパースする
 * エラー時はログ出力して空配列を返す（処理継続）
 */
export async function fetchRssByUsername(username: string): Promise<FetchResult> {
  const rssUrl = buildRssUrl(username);
  console.log(`[RSS] Fetching @${username} from ${rssUrl}`);

  try {
    const feed = await parser.parseURL(rssUrl);

    const items: RssItem[] = feed.items
      .map((item) => {
        const url = extractUrl(item);
        if (!url) return null; // URLなしは除外

        return {
          title: item.title ?? "(no title)",
          content: extractContent(item as any),
          url,
          publishedAt: extractPublishedAt(item),
        } satisfies RssItem;
      })
      .filter((item): item is RssItem => item !== null);

    console.log(`[RSS] @${username}: ${items.length}件取得`);
    return { username, items };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[RSS] @${username} 取得失敗: ${errorMsg}`);
    // エラーでも処理継続（errを返して呼び出し側でハンドリング）
    return { username, items: [], error: errorMsg };
  }
}
