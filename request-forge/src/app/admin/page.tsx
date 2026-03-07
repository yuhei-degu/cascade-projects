/**
 * 管理者ダッシュボード — 依頼一覧
 */
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RequestStatus, STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, BUDGET_LABELS } from "@/types";

interface RequestItem {
  id: string; title: string; category: string; budget: string;
  status: RequestStatus; email: string; aiScore: number | null; aiVerdict: string | null;
  createdAt: string;
  evaluations: { model: string; feasible: boolean; feasibilityScore: number }[];
  _count: { messages: number };
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "すべて" },
  ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

export default function AdminPage() {
  const [items, setItems]   = useState<RequestItem[]>([]);
  const [total, setTotal]   = useState(0);
  const [page,  setPage]    = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) });
    const r = await fetch(`/api/requests?${q}`);
    const j = await r.json();
    if (j.success) { setItems(j.data.requests); setTotal(j.data.total); }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">⚡ RequestForge <span className="text-gray-500 font-normal text-base">管理画面</span></h1>
            <p className="text-gray-500 text-sm mt-1">全 {total} 件の依頼</p>
          </div>
          <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition-colors">
            🔄 更新
          </button>
        </div>

        {/* フィルター */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { setStatus(opt.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === opt.value ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* テーブル */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">タイトル / 依頼者</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">カテゴリ</th>
                  <th className="text-left px-4 py-3">ステータス</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">AIスコア</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">日時</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-600">依頼がありません</td></tr>
                )}
                {items.map(item => (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[200px]">{item.title}</div>
                      <div className="text-xs text-gray-500 truncate">{item.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-xs">
                      {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.aiScore != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.aiScore >= 60 ? "bg-emerald-500" : "bg-red-500"}`}
                              style={{ width: `${item.aiScore}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{item.aiScore.toFixed(0)}</span>
                        </div>
                      ) : <span className="text-gray-600 text-xs">審査前</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/requests/${item.id}`}
                        className="bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium">
                        詳細 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ページネーション */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>{total} 件中 {Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} 件</span>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">← 前</button>
            <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">次 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
