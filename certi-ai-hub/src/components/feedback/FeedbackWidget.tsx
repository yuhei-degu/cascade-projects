"use client"
// src/components/feedback/FeedbackWidget.tsx
import { useState } from "react"
import { MessageSquarePlus, X, CheckCircle } from "lucide-react"

const CATEGORIES = [
  { value: "bug",        label: "🐛 不具合・バグ" },
  { value: "suggestion", label: "💡 改善の提案" },
  { value: "question",   label: "❓ 質問・わからない" },
  { value: "content",    label: "📝 問題内容について" },
  { value: "general",    label: "💬 その他" },
]

export function FeedbackWidget() {
  const [open, setOpen]         = useState(false)
  const [category, setCategory] = useState("suggestion")
  const [message, setMessage]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, page_url: window.location.pathname }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setDone(true)
      setTimeout(() => {
        setOpen(false); setDone(false); setMessage(""); setCategory("suggestion")
      }, 2500)
    } catch {
      setError("送信できませんでした。再度お試しください。")
      setLoading(false)
    }
  }

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={() => { setOpen(true); setDone(false); setError("") }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="ご意見・ご要望を送る">
        <MessageSquarePlus size={16} />
        <span className="hidden sm:inline">ご意見・ご要望</span>
      </button>

      {/* オーバーレイ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7">

            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-gray-800 text-lg">ご意見・ご要望</h2>
                <p className="text-gray-400 text-xs mt-0.5">いただいた声はサービス改善に活かします</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {done ? (
              /* 送信完了 */
              <div className="py-8 text-center">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="font-bold text-gray-700 mb-1">ありがとうございます！</p>
                <p className="text-gray-400 text-sm">いただいたご意見を参考にします。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* カテゴリ */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">カテゴリ</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {CATEGORIES.map(c => (
                      <label key={c.value}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors text-sm ${
                          category === c.value
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-bold"
                            : "border-gray-100 hover:border-gray-200 text-gray-600"
                        }`}>
                        <input type="radio" name="category" value={c.value}
                          checked={category === c.value}
                          onChange={() => setCategory(c.value)}
                          className="sr-only" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* メッセージ */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    メッセージ
                    <span className="text-gray-300 font-normal ml-2">{message.length}/1000</span>
                  </label>
                  <textarea
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="気になったこと、改善してほしいこと、何でもどうぞ。"
                    rows={4} maxLength={1000} required
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button type="submit" disabled={loading || !message.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-50 text-sm">
                  {loading ? "送信中..." : "送信する"}
                </button>
                <p className="text-center text-xs text-gray-300">匿名でも送れます</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
