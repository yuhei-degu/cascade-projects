/**
 * components/PostCard.tsx
 * 投稿1件を表示するカードコンポーネント
 */
"use client";

interface Post {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  account: {
    username: string;
    displayName: string | null;
  };
}

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function PostCard({ post }: PostCardProps) {
  const displayName = post.account.displayName ?? `@${post.account.username}`;
  const cleanContent = stripHtml(post.content);

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-violet-500/50 transition-colors">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {post.account.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm text-white">{displayName}</p>
            <p className="text-xs text-gray-500">@{post.account.username}</p>
          </div>
        </div>
        <time className="text-xs text-gray-500" dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
      </div>

      {/* タイトル */}
      {post.title !== post.content && (
        <h3 className="text-sm font-semibold text-gray-200 mb-2 line-clamp-2">
          {post.title}
        </h3>
      )}

      {/* 本文 */}
      {cleanContent && (
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-4 mb-3">
          {cleanContent}
        </p>
      )}

      {/* フッター */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
      >
        元のポストを見る →
      </a>
    </article>
  );
}
