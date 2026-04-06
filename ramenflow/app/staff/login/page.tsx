'use client'
// app/staff/login/page.tsx
// S1: スタッフログイン画面
// Supabase Auth メール/パスワード認証

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function StaffLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/staff/orders'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('メールアドレスまたはパスワードが正しくありません。')
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6">
      {/* ロゴ */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🍜</div>
        <h1 className="text-3xl font-bold font-serif text-brand-dark">RamenFlow</h1>
        <p className="text-lg font-sans text-brand-dark/60 mt-1">スタッフ・オーナーの方はこちら</p>
      </div>

      {/* ログインフォーム */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8">
        <h2 className="text-lg font-bold font-sans text-brand-dark mb-6 text-center">
          ログイン
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-sans text-red-700">
              {error}
            </div>
          )}

          {/* メールアドレス */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-sans font-semibold text-brand-dark mb-1.5"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                'w-full h-14 px-4 rounded-xl border-2 font-sans text-lg text-brand-dark',
                'bg-brand-cream/50 outline-none transition-colors',
                'border-brand-dark/15 focus:border-brand-red',
                'placeholder:text-brand-dark/30'
              )}
              placeholder="example@email.com"
            />
          </div>

          {/* パスワード */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-sans font-semibold text-brand-dark mb-1.5"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full h-14 px-4 rounded-xl border-2 font-sans text-lg text-brand-dark',
                'bg-brand-cream/50 outline-none transition-colors',
                'border-brand-dark/15 focus:border-brand-red',
                'placeholder:text-brand-dark/30'
              )}
              placeholder="••••••••"
            />
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full h-16 rounded-2xl font-sans font-bold text-xl text-white',
              'bg-brand-red transition-all duration-150',
              'hover:bg-red-700 active:bg-red-800',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2 mt-2'
            )}
          >
            {loading ? (
              <>
                <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ログイン中...
              </>
            ) : 'ログイン'}
          </button>
        </form>
      </div>

      {/* フッター */}
      <p className="mt-8 text-xs font-sans text-brand-dark/40 text-center">
        パスワードを忘れた方はオーナーにお問い合わせください
      </p>
    </div>
  )
}
