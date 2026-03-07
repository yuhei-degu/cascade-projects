/**
 * チャットページ — /chat/[id]
 * 依頼者が修正・質問をやりとりするページ
 * URLパラメータ: id=requestId, token=previewToken
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface Message {
  id: string;
  author: "admin" | "client" | "system";
  content: string;
  is_internal: boolean;
  created_at: string;
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // メッセージ取得
  async function loadMessages() {
    if (!id || !token) return;
    try {
      const res = await fetch(`/api/chat?requestId=${id}&token=${token}`);
      const j = await res.json();
      if (j.success) {
        setMessages(j.data);
      } else {
        setError(j.error ?? "読み込みに失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  // 依頼タイトル取得
  async function loadRequest() {
    if (!token) return;
    try {
      const res = await fetch(`/api/preview?token=${token}`);
      const j = await res.json();
      if (j.success) setRequestTitle(j.data.title ?? "");
    } catch { /* noop */ }
  }

  useEffect(() => {
    loadRequest();
    loadMessages();
    // 30秒ごとに自動更新（簡易ポーリング）
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  // 新着時に自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMsg.trim() || !id || !token) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          token,
          content: newMsg.trim(),
          author: "client",
        }),
      });
      const j = await res.json();
      if (j.success) {
        setMessages(prev => [...prev, j.data]);
        setNewMsg("");
      } else {
        alert(j.error ?? "送信に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setSending(false);
    }
  }

  // トークンなしアクセス
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-lg font-bold mb-2">アクセスできません</h1>
          <p className="text-slate-400 text-sm">URLに認証トークンが含まれていません。<br />メールのリンクからアクセスしてください。</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <h1 className="text-lg font-bold mb-2">エラー</h1>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* ヘッダー */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-sm">⚡</div>
        <div>
          <p className="font-semibold text-sm">AI Dev Market サポート</p>
          {requestTitle && (
            <p className="text-xs text-slate-400 truncate max-w-xs">{requestTitle}</p>
          )}
        </div>
        <button
          onClick={loadMessages}
          className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          🔄 更新
        </button>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-slate-500 text-sm animate-pulse">読み込み中...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-slate-500 text-sm">まだメッセージはありません</p>
            <p className="text-slate-600 text-xs mt-1">修正依頼や質問はこちらからどうぞ</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.author === "client" ? "justify-end" : "justify-start"}`}
            >
              {msg.author !== "client" && (
                <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-auto">
                  ⚡
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.author === "client"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : msg.author === "system"
                    ? "bg-slate-700 text-slate-300 text-xs"
                    : "bg-slate-800 text-slate-200 rounded-bl-sm"
                }`}
              >
                {msg.author === "system" && (
                  <p className="text-slate-500 text-xs mb-0.5">システム</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.author === "client" ? "text-violet-300" : "text-slate-500"}`}>
                  {new Date(msg.created_at).toLocaleString("ja-JP", {
                    month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="修正依頼や質問を入力...（Shift+Enterで改行）"
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 flex-shrink-0 font-semibold text-sm"
          >
            {sending ? "⌛" : "送信"}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          ご質問・修正依頼はこちらからお気軽にどうぞ
        </p>
      </div>
    </div>
  );
}
