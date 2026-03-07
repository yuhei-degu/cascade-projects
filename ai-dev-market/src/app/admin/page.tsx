"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { STATUS_LABEL, STATUS_COLOR, CATEGORY_LABEL, VERDICT_LABEL, VERDICT_COLOR, RequestStatus, AiVerdict } from "@/types";

interface Item {
  id: string; title: string; category: string; budget: string; status: RequestStatus;
  email: string; ai_verdict: AiVerdict|null; ai_score: number|null; created_at: string;
}

const STATUSES = ["", ...Object.keys(STATUS_LABEL)] as (RequestStatus|"")[];

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus|"">("");
  const [loading, setLoading] = useState(true);
  // 売上サマリー
  const [stats, setStats] = useState({ total_revenue: 0, paid_count: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), ...(statusFilter ? { status: statusFilter } : {}) });
    const r = await fetch(`/api/requests?${q}`);
    const j = await r.json();
    if (j.success) { setItems(j.data.requests); setTotal(j.data.total); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black">⚡ AI Dev Market <span className="text-slate-500 font-normal text-sm">管理</span></h1>
            <p className="text-slate-500 text-xs mt-0.5">全 {total} 件</p>
          </div>
          <button onClick={load} className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg">🔄</button>
        </div>

        {/* ステータスフィルター */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {STATUSES.slice(0, 8).map(s => (
            <button key={String(s)} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
              {s ? STATUS_LABEL[s as RequestStatus] : "すべて"}
            </button>
          ))}
        </div>

        {/* テーブル */}
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">タイトル</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">カテゴリ</th>
                  <th className="text-left px-4 py-3">ステータス</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">AI判定</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">日時</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-600">依頼なし</td></tr>}
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-[180px]">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">{item.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-400">
                      {CATEGORY_LABEL[item.category as keyof typeof CATEGORY_LABEL] ?? item.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${STATUS_COLOR[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.ai_verdict ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${VERDICT_COLOR[item.ai_verdict]}`}>
                          {item.ai_verdict} {item.ai_score && `(${item.ai_score})`}
                        </span>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/requests/${item.id}`}
                        className="bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-xs px-2.5 py-1.5 rounded-lg transition-colors">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ページネーション */}
        <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
          <span>{total}件</span>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 bg-slate-800 rounded-lg disabled:opacity-40">←</button>
            <span className="px-2 py-1.5">{page}</span>
            <button disabled={page*20>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 bg-slate-800 rounded-lg disabled:opacity-40">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
