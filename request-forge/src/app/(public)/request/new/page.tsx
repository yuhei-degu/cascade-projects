"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, BUDGET_LABELS, RequestCategory, BudgetRange } from "@/types";

const categories = Object.entries(CATEGORY_LABELS) as [RequestCategory, string][];
const budgets    = Object.entries(BUDGET_LABELS) as [BudgetRange, string][];

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");
  const [form, setForm] = useState({
    title: "", description: "", category: "website" as RequestCategory,
    budget: "negotiable" as BudgetRange, deadline: "", email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-black mb-3">依頼を受け付けました！</h1>
        <p className="text-gray-400 mb-6">AIによる審査を行っています。<br/>結果はメールでお知らせします（数分以内）。</p>
        <button onClick={() => router.push("/")} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors">
          トップに戻る
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-violet-400 text-sm hover:underline">← トップへ</a>
          <h1 className="text-3xl font-black mt-4 mb-2">依頼を投稿する</h1>
          <p className="text-gray-400">AIが審査して、実現可能な依頼のみ受け付けます。審査は無料です。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-semibold mb-2">依頼タイトル <span className="text-red-400">*</span></label>
            <input
              value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              placeholder="例: ポートフォリオサイトを作ってほしい"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors"
              required minLength={5} maxLength={100}
            />
          </div>

          {/* カテゴリ・予算 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">カテゴリ <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as RequestCategory}))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500">
                {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">希望予算</label>
              <select value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value as BudgetRange}))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500">
                {budgets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* 詳細 */}
          <div>
            <label className="block text-sm font-semibold mb-2">詳細説明 <span className="text-red-400">*</span></label>
            <textarea
              value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={8} placeholder="どんなものを作りたいか、使う技術・デザインのイメージ・参考サイト・特記事項など、できるだけ詳しく書いてください。"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors resize-none"
              required minLength={20} maxLength={3000}
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{form.description.length}/3000</p>
          </div>

          {/* 希望納期・メール */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">希望納期（任意）</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">連絡先メール <span className="text-red-400">*</span></label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                required
              />
            </div>
          </div>

          {error && <p className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</p>}

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-sm text-gray-400">
            <p>✅ 審査は無料 / 断られても料金は発生しません</p>
            <p>✅ 審査結果は数分以内にメールでお知らせします</p>
            <p>✅ 成果物の確認後にお支払い（Stripe決済）</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full gradient-brand text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "審査リクエスト送信中..." : "依頼を送信する →"}
          </button>
        </form>
      </div>
    </div>
  );
}
