"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABEL, BUDGET_LABEL, RequestCategory, BudgetRange } from "@/types";

const cats = Object.entries(CATEGORY_LABEL) as [RequestCategory, string][];
const budgets = Object.entries(BUDGET_LABEL) as [BudgetRange, string][];

export default function NewRequestPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    title: "", description: "", category: "script" as RequestCategory,
    budget: "under_20k" as BudgetRange, deadline: "", email: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally { setLoading(false); }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-xl font-black mb-3">依頼を受け付けました！</h1>
        <p className="text-slate-400 text-sm mb-2">AIによる審査を開始しました。</p>
        <p className="text-slate-400 text-sm mb-6">実現可能な依頼には<strong className="text-violet-400">試作プロトタイプ</strong>をメールでお知らせします（数分以内）。</p>
        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-500 mb-6">
          審査→試作までは無料。OKの場合のみ決済。
        </div>
        <button onClick={() => router.push("/")} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors">トップへ戻る</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        <a href="/" className="text-violet-400 text-sm hover:underline">← トップへ</a>
        <h1 className="text-2xl font-black mt-4 mb-1">依頼を投稿する</h1>
        <p className="text-slate-400 text-sm mb-8">AIが審査→試作生成まで無料。OKなら決済へ進みます。</p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5">依頼タイトル <span className="text-red-400">*</span></label>
            <input value={f.title} onChange={e => setF(p=>({...p,title:e.target.value}))}
              placeholder="例: Excelを自動整形するPythonスクリプト"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
              required minLength={5} maxLength={100} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">カテゴリ <span className="text-red-400">*</span></label>
              <select value={f.category} onChange={e => setF(p=>({...p,category:e.target.value as RequestCategory}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 focus:outline-none focus:border-violet-500">
                {cats.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">希望予算</label>
              <select value={f.budget} onChange={e => setF(p=>({...p,budget:e.target.value as BudgetRange}))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 focus:outline-none focus:border-violet-500">
                {budgets.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">詳細説明 <span className="text-red-400">*</span></label>
            <textarea value={f.description} onChange={e => setF(p=>({...p,description:e.target.value}))}
              rows={8} placeholder={`詳しく書くほど精度が上がります：\n・何をしたいか（目的）\n・入力データの形式（例：CSV、Excelの列名）\n・出力してほしい形（例：グラフ、新しいCSV）\n・使用環境（例：Windows、Python、ブラウザ）\n・参考にしたいサイトや画像のURL`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 resize-none"
              required minLength={20} maxLength={3000} />
            <p className="text-xs text-slate-600 text-right mt-1">{f.description.length}/3000</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">希望納期（任意）</label>
              <input type="date" value={f.deadline} onChange={e => setF(p=>({...p,deadline:e.target.value}))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">メールアドレス <span className="text-red-400">*</span></label>
              <input type="email" value={f.email} onChange={e => setF(p=>({...p,email:e.target.value}))}
                placeholder="your@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 focus:outline-none focus:border-violet-500"
                required />
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-400 space-y-1">
            <p>✅ 審査・試作確認まで完全無料</p>
            <p>✅ 試作がイメージと違えば無料キャンセル可能</p>
            <p>✅ 対応できない依頼は自動的にお断りします</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "審査リクエスト送信中..." : "依頼を送信する →"}
          </button>
        </form>
      </div>
    </div>
  );
}
