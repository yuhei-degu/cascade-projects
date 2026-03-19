"use client"
// src/components/layout/Header.tsx
import Link from "next/link"
import { Menu, LogOut, Crown } from "lucide-react"
import { useSidebar } from "./SidebarContext"
import { useEffect, useState } from "react"
import { createAuthClient } from "@/lib/supabase/auth"
import { useRouter } from "next/navigation"

export default function Header() {
  const { toggle } = useSidebar()
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [premium, setPremium] = useState(false)

  useEffect(() => {
    const db = createAuthClient()
    db.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        db.from("profiles").select("is_premium").eq("id", data.user.id).single()
          .then(({ data: p }) => setPremium(p?.is_premium ?? false))
      }
    })
    const { data: { subscription } } = db.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const db = createAuthClient()
    await db.auth.signOut()
    setUser(null); setPremium(false)
    router.push("/"); router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <button onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          aria-label="サイドバーを開閉">
          <Menu size={20} />
        </button>

        <Link href="/" className="flex items-center gap-2 font-black text-lg md:hidden">
          <span>🎓</span><span>Certi-AI <span className="text-brand">Hub</span></span>
        </Link>

        {/* モバイルナビ */}
        <nav className="flex md:hidden items-center gap-3 text-xs font-medium text-gray-600 ml-auto">
          <Link href="/common/exam?module=SC&mode=exam" className="hover:text-brand transition-colors">📋 SC</Link>
          <Link href="/common/exam?module=AIF&mode=exam" className="hover:text-aws transition-colors">📋 AIF</Link>
        </nav>

        {/* ログイン状態 */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {premium && (
                <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <Crown size={11} />プレミアム
                </span>
              )}
              {!premium && (
                <Link href="/pricing"
                  className="hidden sm:block text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors">
                  ✨ アップグレード
                </Link>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <LogOut size={14} />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-xs font-bold text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                ログイン
              </Link>
              <Link href="/pricing"
                className="text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors">
                ✨ プレミアム
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
