"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STATUS_LABEL, STATUS_COLOR, CATEGORY_LABEL, BUDGET_LABEL, VERDICT_LABEL, VERDICT_COLOR, RequestStatus, AiVerdict } from "@/types";

interface Detail {
  id: string; title: string; description: string; category: string; budget: string;
  deadline?: string; email: string; status: RequestStatus;
  ai_verdict?: AiVerdict; ai_score?: number; ai_estimated_hours?: number; ai_estimated_price?: number;
  prototype_code?: string; prototype_lang?: string; prototype_note?: string;
  deliverable_url?: string; deliverable_note?: string;
  paid_amount?: number; paid_at?: string; free_revision_used: boolean;
  preview_token?: string; created_at: string;
  ai_evaluations: { id: string; model: string; verdict: AiVerdict; score: number; estimated_hours?: number; estimated_price?: number; concerns?: string[]; suggestions?: string }[];
  messages: { id: string; author: string; content: string; is_internal: boolean; created_at: string }[];
  activity_logs: { id: string; action: string; detail?: string; actor?: string; created_at: string }[];
}

const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  accepted:        ["paid", "rejected"],
  prototype_ok:    ["paid", "rejected"],
  paid:            ["delivered"],
  delivered:       ["revision", "closed"],
  revision:        ["paid", "closed"],
};

type Tab = "overview" | "ai" | "prototype" | "chat" | "logs";

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [req,  setReq]   = useState<Detail | null>(null);
  const [busy, setBusy]  = useState(false);
  const [tab,  setTab]   = useState<Tab>("overview");
  const [deliverUrl,  setDeliverUrl]  = useState("");
  const [deliverNote, setDeliverNote] = useState("");
  const [adminMsg,    setAdminMsg]    = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/requests/${id}`);
    const j = await r.json();
    if (j.success) setReq(j.data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    const r = await fetch(`/api/requests/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!j.success) alert(j.error ?? "エラー");
    else await load();
    setBusy(false);
    return j;
  }

  if (!req) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500 animate-pulse">読み込み中...</p></div>;

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const previewUrl = req.preview_token ? `${base}/preview/${req.preview_token}` : null;
  const nexts = NEXT_STATUS[req.status] ?? [];

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Link href="/admin" className="text-violet-400 text-xs hover:underline">← 一覧</Link>
            <h1 className="text-lg font-black mt-1">{req.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLOR[req.status]}`}>{STATUS_LABEL[req.status]}</span>
              <span className="text-xs text-slate-500">{CATEGORY_LABEL[req.category as keyof typeof CATEGORY_LABEL]}</span>
              <span className="text-xs text-slate-500">{BUDGET_LABEL[req.budget as keyof typeof BUDGET_LABEL]}</span>
              {req.ai_verdict && <span className={`px-2 py-0.5 rounded text-xs font-bold ${VERDICT_COLOR[req.ai_verdict]}`}>{VERDICT_LABEL[req.ai_verdict]}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {req.ai_score != null && <div className={`text-2xl font-black ${req.ai_score >= 60 ? "text-emerald-400" : "text-red-400"}`}>{req.ai_score}</div>}
            {req.paid_amount && <div className="text-sm text-emerald-400 font-semibold">¥{req.paid_amount.toLocaleString()}</div>}
          </div>
        </div>

        {/* ステータス遷移ボタン */}
        {nexts.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">変更:</span>
            {nexts.map(s => (
              <button key={s} disabled={busy} onClick={() => act({ action: "update_status", status: s })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${s === "rejected" || s === "closed" ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "bg-violet-600/20 text-violet-400 hover:bg-violet-600/40"}`}>
                → {STATUS_LABEL[s]}
              </button>
            ))}
            <button disabled={busy} onClick={() => act({ action: "rerun_prototype" })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50 ml-auto">
              🔄 AI再審査
            </button>
          </div>
        )}

        {/* タブ */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-4">
          {([["overview","概要"],["ai","AI審査"],["prototype","試作"],["chat","チャット"],["logs","ログ"]] as [Tab,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab===k?"bg-violet-600 text-white":"text-slate-400 hover:text-slate-200"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* 概要タブ */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">依頼内容</h3>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{req.description}</p>
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                <span>📧 {req.email}</span>
                {req.deadline && <span>📅 {new Date(req.deadline).toLocaleDateString("ja-JP")}</span>}
                <span>🕐 {new Date(req.created_at).toLocaleDateString("ja-JP")}</span>
              </div>
            </div>

            {/* プレビューURL */}
            {previewUrl && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">依頼者向け確認URL</p>
                  <code className="text-xs text-violet-400 break-all">{previewUrl}</code>
                </div>
                <button onClick={() => navigator.clipboard.writeText(previewUrl)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg flex-shrink-0">コピー</button>
              </div>
            )}

            {/* 納品フォーム */}
            {req.status === "paid" && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-400 text-sm mb-3">🚀 納品する</h3>
                <input value={deliverUrl} onChange={e => setDeliverUrl(e.target.value)} placeholder="GitHub URL / デプロイ先 / ダウンロードリンク"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-emerald-500" />
                <textarea value={deliverNote} onChange={e => setDeliverNote(e.target.value)} rows={2} placeholder="納品備考（使い方・環境要件など）"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:border-emerald-500 resize-none" />
                <button disabled={busy || !deliverUrl.trim()} onClick={() => act({ action: "deliver", deliverableUrl: deliverUrl, deliverableNote: deliverNote })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {busy ? "送信中..." : "納品メールを送信 →"}
                </button>
              </div>
            )}

            {/* 管理者メッセージ */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">管理者メッセージ</h3>
              <textarea value={adminMsg} onChange={e => setAdminMsg(e.target.value)} rows={2} placeholder="依頼者に返信 or 内部メモ..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none mb-2" />
              <div className="flex gap-2">
                <button disabled={busy || !adminMsg.trim()} onClick={() => act({ action: "add_message", content: adminMsg, isInternal: false }).then(() => setAdminMsg(""))}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4 py-1.5 rounded-lg disabled:opacity-50">依頼者に送信</button>
                <button disabled={busy || !adminMsg.trim()} onClick={() => act({ action: "add_message", content: adminMsg, isInternal: true }).then(() => setAdminMsg(""))}
                  className="bg-slate-700 hover:bg-slate-600 text-xs px-4 py-1.5 rounded-lg disabled:opacity-50">内部メモとして保存</button>
              </div>
            </div>
          </div>
        )}

        {/* AI審査タブ */}
        {tab === "ai" && (
          <div className="space-y-3">
            {req.ai_evaluations.length === 0 ? (
              <div className="text-center py-12 text-slate-600">AI審査データなし</div>
            ) : req.ai_evaluations.map(ev => (
              <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{ev.model}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${VERDICT_COLOR[ev.verdict]}`}>{VERDICT_LABEL[ev.verdict]}</span>
                  </div>
                  <span className={`text-xl font-black ${ev.score >= 60 ? "text-emerald-400" : "text-red-400"}`}>{ev.score}</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400 mb-3">
                  {ev.estimated_hours && <span>⏱ {ev.estimated_hours}時間</span>}
                  {ev.estimated_price && <span>💴 ¥{ev.estimated_price.toLocaleString()}</span>}
                </div>
                {ev.concerns && ev.concerns.length > 0 && (
                  <ul className="space-y-1 mb-2">{ev.concerns.map((c, i) => <li key={i} className="text-xs text-slate-300 flex gap-2"><span className="text-red-400">•</span>{c}</li>)}</ul>
                )}
                {ev.suggestions && <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-300">{ev.suggestions}</div>}
              </div>
            ))}
          </div>
        )}

        {/* 試作タブ */}
        {tab === "prototype" && (
          <div className="space-y-3">
            {req.prototype_code ? (
              <>
                {req.prototype_note && (
                  <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 text-sm text-violet-200">{req.prototype_note}</div>
                )}
                {req.prototype_lang === "html" && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">プレビュー:</p>
                    <iframe srcDoc={req.prototype_code} className="w-full h-64 rounded-xl border border-slate-700 bg-white" title="proto" sandbox="allow-scripts" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">コード ({req.prototype_lang?.toUpperCase()}):</p>
                  <pre className="bg-slate-900 border border-slate-700 rounded-xl p-3 overflow-x-auto text-slate-300 text-xs max-h-72 code-preview">{req.prototype_code}</pre>
                </div>
              </>
            ) : <div className="text-center py-12 text-slate-600">試作データなし</div>}
          </div>
        )}

        {/* チャットタブ */}
        {tab === "chat" && (
          <div>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-3">
              {req.messages.length === 0 && <p className="text-center py-8 text-slate-600">メッセージなし</p>}
              {req.messages.map(m => (
                <div key={m.id} className={`rounded-xl p-3 ${m.is_internal ? "bg-yellow-500/10 border border-yellow-500/20" : m.author === "client" ? "bg-slate-800" : "bg-violet-500/10 border border-violet-500/20"}`}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{m.author === "client" ? "依頼者" : m.author === "admin" ? "管理者" : "システム"}{m.is_internal && " 🔒"}</span>
                    <span>{new Date(m.created_at).toLocaleString("ja-JP", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" })}</span>
                  </div>
                  <p className="text-sm text-slate-200">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ログタブ */}
        {tab === "logs" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {req.activity_logs.length === 0 && <div className="p-8 text-center text-slate-600">ログなし</div>}
            {req.activity_logs.map(l => (
              <div key={l.id} className="px-4 py-2.5 flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium">{l.action}</span>
                  {l.detail && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{l.detail}</p>}
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xs text-slate-600">{l.actor}</p>
                  <p className="text-xs text-slate-600">{new Date(l.created_at).toLocaleString("ja-JP", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
