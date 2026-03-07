/**
 * components/AddAccountForm.tsx
 * アカウント追加フォーム（クライアントコンポーネント）
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTED_ACCOUNTS = [
  { username: "elonmusk",     label: "Elon Musk" },
  { username: "sama",         label: "Sam Altman" },
  { username: "demishassabis",label: "Demis Hassabis" },
  { username: "karpathy",     label: "Andrej Karpathy" },
  { username: "ylecun",       label: "Yann LeCun" },
];

export function AddAccountForm() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    const trimmed = username.trim().replace(/^@/, "");
    if (!trimmed) { setMessage({ type: "err", text: "usernameを入力してください" }); return; }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, displayName: displayName.trim() || null }),
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: "ok", text: `@${trimmed} を追加しました ✅` });
        setUsername("");
        setDisplayName("");
        router.refresh();
      } else {
        setMessage({ type: "err", text: json.error ?? "追加に失敗しました" });
      }
    } catch {
      setMessage({ type: "err", text: "通信エラー" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* 入力フォーム */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">
            ユーザー名 <span className="text-red-400">*</span>
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="例: elonmusk (@なし)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">表示名（任意）</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: Elon Musk"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="self-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "追加中..." : "+ 追加"}
          </button>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <p className={`text-sm mb-4 ${message.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      {/* サジェスト */}
      <div>
        <p className="text-xs text-gray-500 mb-2">よく使われるアカウント:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_ACCOUNTS.map((s) => (
            <button
              key={s.username}
              onClick={() => { setUsername(s.username); setDisplayName(s.label); }}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
            >
              @{s.username}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
