"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface PreviewData {
  id: string; title: string; description: string;
  status: string; deliverableUrl?: string; deliverableNote?: string;
}

type Phase = "loading" | "error" | "review" | "done_approve" | "done_revision";

export default function PreviewPage() {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase]       = useState<Phase>("loading");
  const [data,  setData]        = useState<PreviewData | null>(null);
  const [errMsg, setErrMsg]     = useState("");
  const [comment, setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/preview?token=${token}`)
      .then(r => r.json())
      .then(j => { j.success ? (setData(j.data), setPhase("review")) : (setErrMsg(j.error), setPhase("error")); })
      .catch(() => { setErrMsg("読み込みに失敗しました"); setPhase("error"); });
  }, [token]);

  async function handleAction(action: "approve" | "revision") {
    if (action === "revision" && !comment.trim()) { alert("修正内容を入力してください"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, revisionComment: comment }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (action === "approve" && json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        setPhase(action === "approve" ? "done_approve" : "done_revision");
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "エラーが発生しました");
    } finally { setSubmitting(false); }
  }

  if (phase === "loading") return <CenterMsg icon="⏳" title="読み込み中..." />;
  if (phase === "error")   return <CenterMsg icon="❌" title="エラー" desc={errMsg} />;
  if (phase === "done_revision") return <CenterMsg icon="📝" title="修正依頼を受け付けました" desc="修正完了後に再度確認URLをお送りします。" />;
  if (phase === "done_approve")  return <CenterMsg icon="✅" title="承認ありがとうございます" desc="お支払いページに移動します。" />;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm px-3 py-1 rounded-full mb-4">
            ✉️ 成果物の確認依頼
          </div>
          <h1 className="text-2xl font-black">「{data?.title}」が完成しました</h1>
          <p className="text-gray-400 mt-2">内容をご確認ください。問題なければ「これでOK」を押してお支払いへ進んでください。</p>
        </div>

        {/* 成果物プレビュー */}
        {data?.deliverableUrl && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">📦 成果物</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              {data.deliverableUrl.match(/\.(html|htm)$/) ? (
                <iframe src={data.deliverableUrl} className="w-full h-96 rounded-lg border border-gray-700" title="preview" />
              ) : (
                <a href={data.deliverableUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                  🔗 成果物を開く（新タブ）
                </a>
              )}
              {data.deliverableNote && (
                <div className="mt-4 bg-gray-800 rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {data.deliverableNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* アクションパネル */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* OK */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <h3 className="font-bold text-emerald-400 mb-2">✅ これでOK</h3>
            <p className="text-sm text-gray-400 mb-4">内容に問題なければお支払いへ進みます。</p>
            <button onClick={() => handleAction("approve")} disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              {submitting ? "処理中..." : "承認してお支払いへ →"}
            </button>
          </div>

          {/* 修正 */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
            <h3 className="font-bold text-orange-400 mb-2">🔧 修正が必要</h3>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="修正してほしい内容を具体的に書いてください..."
              rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 mb-3 resize-none"
            />
            <button onClick={() => handleAction("revision")} disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              {submitting ? "送信中..." : "修正を依頼する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CenterMsg({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-2xl font-black mb-2">{title}</h1>
        {desc && <p className="text-gray-400">{desc}</p>}
      </div>
    </div>
  );
}
