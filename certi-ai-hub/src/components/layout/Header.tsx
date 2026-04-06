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
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 transition-all duration-300">
      <div className="h-full px-4 flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
        <button onClick={toggle}
          className="p-2 rounded-xl hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="サイドバーを開閉">
          <Menu size={18} />
        </button>

        <Link href="/" className="flex items-center gap-1.5 font-black text-lg md:hidden tracking-tight">
          <span className="text-xl drop-shadow-sm">🛡️</span><span className="text-slate-900 text-sm font-black">AIセキュリティ<span className="text-indigo-600">エンジニア養成所</span></span>
        </Link>

        {/* モバイルナビ */}
        <nav className="flex md:hidden items-center gap-4 text-xs font-semibold text-slate-500 ml-auto tracking-wide">
          <Link href="/common/exam?module=SC&mode=exam" className="hover:text-indigo-600 transition-colors">SC模試</Link>
          <Link href="/common/exam?module=AIF&mode=exam" className="hover:text-orange-500 transition-colors">AIF模試</Link>
        </nav>

        {/* ログイン状態 */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {premium && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50/80 border border-amber-200/60 px-2.5 py-1 rounded-full shadow-sm">
                  <Crown size={12} strokeWidth={2.5} />プレミアム
                </span>
              )}
              {!premium && (
                <Link href="/pricing"
                  className="hidden sm:block text-[11px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200/60 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  ✨ アップグレード
                </Link>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
                <LogOut size={14} />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-[11px] font-bold text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
                ログイン
              </Link>
              <Link href="/pricing"
                className="text-[11px] font-bold bg-indigo-600 text-white px-3.5 py-1.5 rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                ✨ プレミアム
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
