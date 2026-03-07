/**
 * 決済完了確認ページ — /payment/[token]
 * Stripe success_url から遷移してくるページ
 * tokenで依頼情報を取得し、決済完了の確認を表示
 */
"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface RequestInfo {
  id: string;
  title: string;
  status: string;
  paidAmount?: number;
  email: string;
}

type Phase = "loading" | "success" | "already_paid" | "error";

export default function PaymentTokenPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [phase, setPhase] = useState<Phase>("loading");
  const [info,  setInfo]  = useState<RequestInfo | null>(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!token) { setErrMsg("トークンが見つかりません"); setPhase("error"); return; }

    // プレビューAPIを使ってトークンで依頼情報を取得
    fetch(`/api/preview?token=${token}`)
      .then(r => r.json())
      .then(j => {
        if (!j.success) { setErrMsg(j.error ?? "依頼が見つかりません"); setPhase("error"); return; }
        const req = j.data as RequestInfo;
        setInfo(req);

        // 決済済みステータスか確認
        if (["paid", "building", "review_ready", "revision", "delivered", "closed"].includes(req.status)) {
          setPhase("already_paid");
        } else {
          setPhase("success");
        }
      })
      .catch(() => { setErrMsg("通信エラーが発生しました"); setPhase("error"); });
  }, [token, sessionId]);

  // ─── ローディング ────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⌛</div>
          <p className="text-gray-400">決済を確認中...</p>
        </div>
      </div>
    );
  }

  // ─── エラー ──────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold mb-2">エラーが発生しました</h1>
          <p className="text-gray-400 text-sm mb-6">{errMsg}</p>
          <Link href="/" className="text-violet-400 hover:underline text-sm">トップページへ</Link>
        </div>
      </div>
    );
  }

  // ─── 決済完了 ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">
          {phase === "already_paid" ? "✅" : "🎉"}
        </div>

        <h1 className="text-2xl font-black mb-3">
          {phase === "already_paid" ? "お支払い済みです" : "お支払いありがとうございます！"}
        </h1>

        {info && (
          <p className="text-gray-400 mb-4 text-sm">
            「<strong className="text-white">{info.title}</strong>」のご依頼
          </p>
        )}

        {phase === "success" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-emerald-400 font-semibold text-sm mb-2">✅ 決済が完了しました</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 制作を開始します</li>
              <li>• 完成しましたらメールでご連絡します</li>
              <li>• 確認・修正もメール内のURLから可能です</li>
            </ul>
          </div>
        )}

        {phase === "already_paid" && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-6 text-sm text-gray-300">
            このご依頼はすでに受付・制作中です。<br />
            完成しましたらメールでご連絡します。
          </div>
        )}

        {info?.paidAmount && (
          <div className="bg-gray-800 rounded-xl p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">お支払い金額</p>
            <p className="text-2xl font-black text-emerald-400">¥{info.paidAmount.toLocaleString()}</p>
          </div>
        )}

        <Link href="/"
          className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors">
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
