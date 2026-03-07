/**
 * app/accounts/page.tsx
 * 監視アカウント管理ページ
 */
import { prisma } from "@/lib/db/client";
import { AddAccountForm } from "@/components/AddAccountForm";

async function getAccounts() {
  return prisma.trackedAccount.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1">アカウント管理</h1>
        <p className="text-gray-500 text-sm">
          RSSを監視するXアカウントを管理します
        </p>
      </div>

      {/* アカウント追加フォーム */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">アカウントを追加</h2>
        <AddAccountForm />
      </div>

      {/* アカウント一覧 */}
      <h2 className="text-lg font-bold mb-4">
        監視中のアカウント ({accounts.length}件)
      </h2>

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">👤</div>
          <p>まだアカウントが登録されていません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {/* アバター */}
                <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center font-bold text-white">
                  {acc.username.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {acc.displayName ?? `@${acc.username}`}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        acc.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {acc.isActive ? "監視中" : "停止"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">@{acc.username}</p>

                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                    <span>📝 {acc._count.posts}件の投稿</span>
                    {acc.lastFetchAt && (
                      <span>
                        🕐 最終取得:{" "}
                        {new Date(acc.lastFetchAt).toLocaleString("ja-JP")}
                      </span>
                    )}
                    {acc.fetchError && (
                      <span className="text-red-500">
                        ⚠️ {acc.fetchError}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <a
                  href={`/?username=${acc.username}`}
                  className="text-xs text-violet-400 hover:underline block mb-1"
                >
                  投稿を見る →
                </a>
                <p className="text-xs text-gray-700">
                  {new Date(acc.createdAt).toLocaleDateString("ja-JP")} 追加
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
