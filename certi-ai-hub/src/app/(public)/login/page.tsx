"use client"
// src/app/(public)/login/page.tsx
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createAuthClient } from "@/lib/supabase/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const db = createAuthClient()
    const { error } = await db.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🎓</span>
          <h1 className="text-2xl font-black mt-2">ログイン</h1>
          <p className="text-gray-500 text-sm mt-1">Certi-AI Hub</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-brand text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-xs text-gray-400">
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="text-brand font-bold hover:underline">新規登録</Link>
          </p>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← トップに戻る</Link>
        </div>
      </div>
    </main>
  )
}
