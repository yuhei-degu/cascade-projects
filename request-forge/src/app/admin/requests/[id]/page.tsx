/**
 * 管理者 — 依頼詳細ページ
 * ステータス変更 / プレビューURL発行 / 納品 / 内部メモ
 */
"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, BUDGET_LABELS, RequestStatus } from "@/types";

interface RequestDetail {
  id: string; title: string; description: string; category: string; budget: string;
  deadline?: string; email: string; status: RequestStatus;
  aiVerdict?: string; aiScore?: number; previewToken?: string; deliverableUrl?: string;
  deliverableNote?: string; paidAmount?: number; paidAt?: string; createdAt: string; updatedAt: string;
  evaluations: { id: string; model: string; feasible: boolean; feasibilityScore: number; estimatedHours?: number; estimatedPrice?: number; concerns: string[]; suggestions?: string }[];
  messages: { id: string; author: string; content: string; isInternal: boolean; createdAt: string }[];
  activityLogs: { id: string; action: string; detail?: string; actor?: string; createdAt: string }[];
}

const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  accepted:        ["building", "rejected"],
  building:        ["review_ready", "revision"],
  revision:        ["building", "review_ready"],
  payment_pending: ["paid"],
  paid:            ["delivered"],
};

export default function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq]          = useState<RequestDetail | null>(null);
  const [loading, setLoading]  = useState(true);
  const [busy, setBusy]        = useState(false);
  const [note, setNote]        = useState("");
  const [deliverUrl, setDeliverUrl]   = useState("");
  const [deliverNote, setDeliverNote] = useState("");
  const [tab, setTab]          = useState<"overview"|"ai"|"messages"|"logs">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/requests/${id}`);
    const j = await r.json();
    if (j.success) setReq(j.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function action(body: Record<string, unknown>) {
    setBusy(true);
    const r = await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.success) { await load(); } else { alert(j.error ?? "エラーが発生しました"); }
    setBusy(false);
    return j;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 animate-pulse">読み込み中...</p></div>;
  if (!req) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-400">依頼が見つかりません</p></div>;

  const nextStatuses = NEXT_STATUS[req.status] ?? [];
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <Link href="/admin" className="text-violet-400 text-sm hover:underline">← 一覧</Link>
            <h1 className="text-xl font-black mt-2">{req.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[req.status]}`}>{STATUS_LABELS[req.status]}</span>
              <span className="text-xs text-gray-500">{CATEGORY_LABELS[req.category as keyof typeof CATEGORY_LABELS]}</span>
              <span className="text-xs text-gray-500">{BUDGET_LABELS[req.budget as keyof typeof BUDGET_LABELS]}</span>
              <span className="text-xs text-gray-600">{req.email}</span>
            </div>
          </div>
          {req.aiScore != null && (
            <div className="text-center flex-shrink-0">
              <div className={`text-2xl font-black ${req.aiScore >= 60 ? "text-emerald-400" : "text-red-400"}`}>{req.aiScore.toFixed(0)}</div>
              <div className="text-xs text-gray-500">AIスコア</div>
            </div>
          )}
        </div>

        {/* ステータス変更ボタン */}
        {nextStatuses.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-400 mr-2">ステータス変更:</span>
            {nextStatuses.map(s => (
              <button key={s} disabled={busy} onClick={() => action({ action: "update_status", status: s, estimatedDays: 7 })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${s === "rejected" ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "bg-violet-600/20 text-violet-400 hover:bg-violet-600/40"}`}>
                → {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {/* タブ */}
        <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {[["overview","概要"],["ai","AI審査"],["messages","メッセージ"],["logs","ログ"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as typeof tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab===k ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* 概要タブ */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-gray-300">📋 依頼内容</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{req.description}</p>
              {req.deadline && <p className="text-xs text-gray-500 mt-3">希望納期: {new Date(req.deadline).toLocaleDateString("ja-JP")}</p>}
            </div>

            {/* プレビューURL発行 */}
            {["building","revision","review_ready"].includes(req.status) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
                <h3 className="font-semibold mb-3 text-amber-400">📤 確認URLを発行 → 依頼者へ送信</h3>
                <input value={deliverUrl} onChange={e => setDeliverUrl(e.target.value)} placeholder="成果物URL (GitHub / デプロイ先 / ダウンロード)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-amber-500" />
                <textarea value={deliverNote} onChange={e => setDeliverNote(e.target.value)} rows={3} placeholder="納品備考（使い方・注意事項など）"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-amber-500 resize-none" />
                <button disabled={busy || !deliverUrl.trim()} onClick={() => action({ action: "send_preview", deliverableUrl: deliverUrl, deliverableNote: deliverNote })}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {busy ? "送信中..." : "確認メールを送信 →"}
                </button>
              </div>
            )}

            {/* 手動納品 */}
            {req.status === "paid" && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                <h3 className="font-semibold mb-3 text-emerald-400">🚀 納品する</h3>
                <input value={deliverUrl} onChange={e => setDeliverUrl(e.target.value)} placeholder="最終納品URL"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-emerald-500" />
                <button disabled={busy || !deliverUrl.trim()} onClick={() => action({ action: "deliver", deliverableUrl: deliverUrl, deliverableNote: deliverNote })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {busy ? "送信中..." : "納品メールを送信 →"}
                </button>
              </div>
            )}

            {/* プレビューURLコピー */}
            {req.previewToken && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">確認URL（依頼者用）</p>
                  <code className="text-xs text-violet-400 break-all">{baseUrl}/preview/{req.previewToken}</code>
                </div>
                <button onClick={() => navigator.clipboard.writeText(`${baseUrl}/preview/${req.previewToken}`)}
                  className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-lg flex-shrink-0">コピー</button>
              </div>
            )}

            {/* 内部メモ追加 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-gray-400 text-sm">📝 内部メモを追加</h3>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="依頼者には見えない内部メモ..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none mb-2" />
              <button disabled={busy || !note.trim()} onClick={() => action({ action: "add_note", content: note }).then(() => setNote(""))}
                className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50">保存</button>
            </div>
          </div>
        )}

        {/* AI審査タブ */}
        {tab === "ai" && (
          <div className="space-y-4">
            {req.evaluations.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-600">AI審査データがありません</div>
            ) : req.evaluations.map(ev => (
              <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-bold">{ev.model}</span>
                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full font-semibold ${ev.feasible ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {ev.feasible ? "✅ 実現可能" : "❌ 実現困難"}
                    </span>
                  </div>
                  <div className={`text-2xl font-black ${ev.feasibilityScore >= 60 ? "text-emerald-400" : "text-red-400"}`}>
                    {ev.feasibilityScore}
                  </div>
                </div>
                {ev.estimatedHours && <p className="text-sm text-gray-400 mb-1">⏱ 見積工数: 約 {ev.estimatedHours} 時間</p>}
                {ev.estimatedPrice && <p className="text-sm text-gray-400 mb-3">💴 見積価格: ¥{ev.estimatedPrice.toLocaleString()}</p>}
                {ev.concerns.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">懸念点</p>
                    <ul className="space-y-1">{ev.concerns.map((c, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-red-400">•</span>{c}</li>)}</ul>
                  </div>
                )}
                {ev.suggestions && <div className="mt-3 bg-gray-800 rounded-xl p-3 text-sm text-gray-300">{ev.suggestions}</div>}
              </div>
            ))}
          </div>
        )}

        {/* メッセージタブ */}
        {tab === "messages" && (
          <div className="space-y-3">
            {req.messages.length === 0 && <div className="text-center py-12 text-gray-600">メッセージなし</div>}
            {req.messages.map(msg => (
              <div key={msg.id} className={`rounded-xl p-4 ${msg.isInternal ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-gray-900 border border-gray-800"}`}>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{msg.author} {msg.isInternal && "（内部メモ）"}</span>
                  <span>{new Date(msg.createdAt).toLocaleString("ja-JP")}</span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* ログタブ */}
        {tab === "logs" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {req.activityLogs.length === 0 && <div className="p-8 text-center text-gray-600">ログなし</div>}
            {req.activityLogs.map(log => (
              <div key={log.id} className="px-4 py-3 flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium">{log.action}</span>
                  {log.detail && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{log.detail}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-gray-600">{log.actor}</p>
                  <p className="text-xs text-gray-600">{new Date(log.createdAt).toLocaleString("ja-JP")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
