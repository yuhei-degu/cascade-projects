"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VERDICT_LABEL, VERDICT_COLOR } from "@/types";

interface PreviewData {
  id: string; title: string; status: string; ai_verdict: string | null;
  ai_estimated_price: number | null; prototype_code: string | null;
  prototype_lang: string | null; prototype_note: string | null;
  deliverable_url: string | null; deliverable_note: string | null;
}

type Phase = "loading"|"error"|"review"|"submitting"|"done_ok"|"done_revision"|"done_cancel";

export default function PreviewPage() {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<PreviewData | null>(null);
  const [err, setErr] = useState("");
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState<"prototype"|"chat">("prototype");
  const [messages, setMessages] = useState<{ author: string; content: string; created_at: string }[]>([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    fetch(`/api/preview?token=${token}`)
      .then(r => r.json())
      .then(j => { j.success ? (setData(j.data), setPhase("review")) : (setErr(j.error), setPhase("error")); })
      .catch(() => { setErr("読み込みに失敗しました"); setPhase("error"); });
  }, [token]);

  useEffect(() => {
    if (phase !== "review" || !data) return;
    fetch(`/api/chat?requestId=${data.id}&token=${token}`)
      .then(r => r.json()).then(j => { if (j.success) setMessages(j.data); });
  }, [phase, data, token]);

  async function doAction(action: "ok"|"revision"|"cancel") {
    setPhase("submitting");
    const r = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, comment }),
    });
    const j = await r.json();
    if (!j.success) { setErr(j.error); setPhase("review"); return; }
    if (action === "ok" && j.paymentUrl) { window.location.href = j.paymentUrl; return; }
    setPhase(action === "ok" ? "done_ok" : action === "revision" ? "done_revision" : "done_cancel");
  }

  async function sendMsg() {
    if (!newMsg.trim() || !data) return;
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: data.id, token, content: newMsg, author: "client" }),
    });
    const j = await r.json();
    if (j.success) { setMessages(m => [...m, j.data]); setNewMsg(""); }
  }

  if (phase === "loading") return <Center icon="⏳" title="読み込み中..." />;
  if (phase === "error")   return <Center icon="❌" title="エラー" desc={err} />;
  if (phase === "submitting") return <Center icon="⌛" title="処理中..." />;
  if (phase === "done_revision") return <Center icon="📝" title="修正依頼を送りました" desc="修正完了後に再度お知らせします。" />;
  if (phase === "done_cancel")   return <Center icon="👋" title="キャンセルしました" desc="またいつでもご依頼ください。" />;

  const verdict = data?.ai_verdict as "A"|"B"|"C"|null;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          {verdict && (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${VERDICT_COLOR[verdict]}`}>
              {VERDICT_LABEL[verdict]}
            </span>
          )}
          <h1 className="text-xl font-black">{data?.title}</h1>
          {data?.ai_estimated_price && (
            <p className="text-slate-400 text-sm mt-1">見積金額: <strong className="text-emerald-400">¥{data.ai_estimated_price.toLocaleString()}</strong></p>
          )}
        </div>

        {/* タブ */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-5">
          {[["prototype","🔍 試作確認"],["chat","💬 チャット"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as "prototype"|"chat")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab===k?"bg-violet-600 text-white":"text-slate-400 hover:text-slate-200"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* 試作タブ */}
        {tab === "prototype" && (
          <div className="space-y-5">
            {data?.prototype_code ? (
              <>
                {data.prototype_note && (
                  <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-sm text-violet-200">
                    💡 {data.prototype_note}
                  </div>
                )}
                {data.prototype_lang === "html" ? (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">プレビュー (HTML):</p>
                    <iframe srcDoc={data.prototype_code} className="w-full h-72 rounded-xl border border-slate-700 bg-white" title="prototype preview" sandbox="allow-scripts" />
                  </div>
                ) : null}
                <div>
                  <p className="text-xs text-slate-500 mb-2">コード ({data.prototype_lang?.toUpperCase()}):</p>
                  <pre className="code-preview bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-x-auto text-slate-300 text-xs max-h-64">
                    {data.prototype_code}
                  </pre>
                </div>
              </>
            ) : data?.deliverable_url ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-sm font-semibold mb-3">📦 完成品</p>
                <a href={data.deliverable_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  🔗 成果物を開く
                </a>
                {data.deliverable_note && <p className="mt-3 text-sm text-slate-400 whitespace-pre-wrap">{data.deliverable_note}</p>}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600">プロトタイプを準備中...</div>
            )}

            {/* アクション */}
            {["prototype_ready","revision"].includes(data?.status ?? "") && (
              <div className="grid sm:grid-cols-3 gap-3">
                <button onClick={() => doAction("ok")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
                  ✅ これでOK → 決済へ
                </button>
                <button onClick={() => setTab("chat")}
                  className="bg-amber-600/20 border border-amber-500/30 text-amber-400 font-semibold py-3 rounded-xl hover:bg-amber-600/30 transition-colors">
                  🔧 修正を依頼
                </button>
                <button onClick={() => doAction("cancel")}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-xl transition-colors text-sm">
                  キャンセル
                </button>
              </div>
            )}
          </div>
        )}

        {/* チャットタブ */}
        {tab === "chat" && (
          <div>
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {messages.length === 0 && <p className="text-center text-slate-600 py-8">メッセージなし</p>}
              {messages.map(m => (
                <div key={m.created_at} className={`flex ${m.author === "client" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${m.author === "client" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-200"}`}>
                    <p>{m.content}</p>
                    <p className="text-xs opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder="修正内容や質問を入力..."
                rows={2} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500 resize-none" />
              <button onClick={sendMsg} disabled={!newMsg.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 rounded-xl disabled:opacity-40 transition-colors">送信</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Center({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-xl font-black mb-2">{title}</h1>
        {desc && <p className="text-slate-400 text-sm">{desc}</p>}
      </div>
    </div>
  );
}
