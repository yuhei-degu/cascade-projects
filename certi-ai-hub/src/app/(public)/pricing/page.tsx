"use client"
// src/app/(public)/pricing/page.tsx
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createAuthClient } from "@/lib/supabase/auth"
import { Check } from "lucide-react"

const FREE_FEATURES = ["全カテゴリ学習（1日10問まで）", "SC × AIF 模擬試験", "ヒント表示", "シナジーマップ閲覧", "Interactive Lab"]
const PAID_FEATURES = ["全問題 無制限アクセス（204問+）", "SC × AIF 模擬試験（20問）", "ヒント表示", "シナジーマップ閲覧", "Interactive Lab", "ダッシュボード（学習履歴永続保存）", "AI進捗分析", "試験日カレンダー"]

function PricingContent() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [user, setUser]         = useState<any>(null)
  const [premium, setPremium]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const cancelled = params.get("payment") === "cancelled"

  useEffect(() => {
    const db = createAuthClient()
    db.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        db.from("profiles").select("is_premium").eq("id", data.user.id).single()
          .then(({ data: p }) => setPremium(p?.is_premium ?? false))
      }
    })
  }, [])

  async function handleCheckout() {
    if (!user) { router.push("/login"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch {
        setError(`サーバーエラー (${res.status}): レスポンスが不正です`)
        setLoading(false); return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? `エラーが発生しました (${res.status})`)
        setLoading(false)
      }
    } catch (e: any) {
      setError("通信エラーが発生しました: " + e.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-14 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-2">シンプルな料金プラン</h1>
          <p className="text-gray-500">一回払いで全機能を永久に解放</p>
          {cancelled && <p className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 inline-block">決済がキャンセルされました</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border-2 border-gray-100 p-7">
            <p className="text-xs font-bold text-gray-400 mb-1">無料プラン</p>
            <p className="text-3xl font-black mb-1">¥0</p>
            <p className="text-gray-400 text-xs mb-6">登録不要でお試し</p>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={15} className="text-gray-400 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/" className="block w-full text-center py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:border-gray-300 transition-colors">
              今すぐ開始
            </Link>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl border-2 border-indigo-500 p-7 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full">買い切り</div>
            <p className="text-xs font-bold text-indigo-300 mb-1">プレミアムプラン</p>
            <p className="text-3xl font-black mb-1">¥1,980</p>
            <p className="text-indigo-300 text-xs mb-6">一回払い・永久利用</p>
            <ul className="space-y-2.5 mb-6">
              {PAID_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-indigo-100">
                  <Check size={15} className="text-amber-400 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
            {error && (
              <div className="mb-3 bg-red-500/20 border border-red-400/30 text-red-200 text-xs p-3 rounded-xl">
                ⚠️ {error}
              </div>
            )}
            {premium ? (
              <div className="w-full text-center py-2.5 rounded-xl bg-green-500 text-white text-sm font-black">
                ✅ 購入済み
              </div>
            ) : (
              <button onClick={handleCheckout} disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-indigo-900 font-black text-sm hover:bg-indigo-50 transition-colors disabled:opacity-60">
                {loading ? "処理中..." : user ? "購入する（クレジットカード）" : "ログインして購入"}
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Stripe 決済（SSL暗号化）• クレジットカード対応 • 領収書発行可能
        </p>
      </div>
    </main>
  )
}

export default function PricingPage() {
  return <Suspense><PricingContent /></Suspense>
}
