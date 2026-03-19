"use client"
// src/app/(public)/signup/page.tsx
import { useState } from "react"
import Link from "next/link"
import { createAuthClient } from "@/lib/supabase/auth"

export default function SignupPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const db = createAuthClient()
    const { error } = await db.auth.signUp({ email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🎓</span>
          <h1 className="text-2xl font-black mt-2">新規登録</h1>
          <p className="text-gray-500 text-sm mt-1">Certi-AI Hub</p>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="font-bold text-gray-700 mb-2">メールを確認してください</h2>
            <p className="text-sm text-gray-500 mb-4">{email} に確認メールを送信しました。</p>
            <Link href="/login" className="text-brand font-bold text-sm hover:underline">ログインへ</Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">パスワード（6文字以上）</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? "登録中..." : "アカウントを作成"}
            </button>
          </form>
        )}

        {!done && (
          <p className="mt-4 text-center text-xs text-gray-400">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-brand font-bold hover:underline">ログイン</Link>
          </p>
        )}
      </div>
    </main>
  )
}
