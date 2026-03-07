/**
 * components/RefreshButton.tsx
 * RSS手動取得ボタン（クライアントコンポーネント）
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const { totalNew, totalAccounts, durationMs } = json.data.summary;
        setResult(`✅ ${totalAccounts}アカウント処理 / 新規${totalNew}件 (${durationMs}ms)`);
        router.refresh();
      } else {
        setResult(`❌ ${json.error}`);
      }
    } catch (err) {
      setResult("❌ 通信エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⌛</span>
            取得中...
          </>
        ) : (
          <>🔄 RSS取得</>
        )}
      </button>
      {result && (
        <p className="text-xs text-gray-400">{result}</p>
      )}
    </div>
  );
}
