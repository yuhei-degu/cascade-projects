/**
 * app/page.tsx
 * 投稿一覧ページ（サーバーコンポーネント）
 */
import { prisma } from "@/lib/db/client";
import { PostCard } from "@/components/PostCard";
import { RefreshButton } from "@/components/RefreshButton";

interface SearchParams {
  page?: string;
  username?: string;
}

async function getPosts(page: number, username?: string) {
  const per = 20;
  const where = username ? { account: { username } } : {};

  const [posts, total, accounts] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { account: { select: { username: true, displayName: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * per,
      take: per,
    }),
    prisma.post.count({ where }),
    prisma.trackedAccount.findMany({
      where: { isActive: true },
      select: { username: true, displayName: true },
      orderBy: { username: "asc" },
    }),
  ]);

  return { posts, total, accounts, totalPages: Math.ceil(total / per) };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const username = searchParams.username;
  const { posts, total, accounts, totalPages } = await getPosts(page, username);

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black mb-1">投稿一覧</h1>
          <p className="text-gray-500 text-sm">
            {total.toLocaleString()}件の投稿
            {username && (
              <span className="ml-2 text-violet-400">@{username} でフィルター中</span>
            )}
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* アカウントフィルター */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <a
            href="/"
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !username
                ? "bg-violet-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            すべて
          </a>
          {accounts.map((acc) => (
            <a
              key={acc.username}
              href={`/?username=${acc.username}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                username === acc.username
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              @{acc.username}
            </a>
          ))}
        </div>
      )}

      {/* 投稿グリッド */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold mb-2">まだ投稿がありません</h2>
          <p className="text-gray-500 text-sm mb-4">
            監視アカウントを追加してRSSを取得してください
          </p>
          <a
            href="/accounts"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            アカウントを追加する →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post as any} />
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <a
              href={`/?page=${page - 1}${username ? `&username=${username}` : ""}`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              ← 前へ
            </a>
          )}
          <span className="px-4 py-2 text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/?page=${page + 1}${username ? `&username=${username}` : ""}`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              次へ →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
