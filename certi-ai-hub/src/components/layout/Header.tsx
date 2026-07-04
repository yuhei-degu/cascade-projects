"use client"

import Link from "next/link"
import { Crown, LogOut, Menu, PlayCircle } from "lucide-react"
import { useSidebar } from "./SidebarContext"
import { useEffect, useState } from "react"
import { createAuthClient } from "@/lib/supabase/auth"
import { useRouter } from "next/navigation"

export default function Header() {
  const { toggle } = useSidebar()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [premium, setPremium] = useState(false)

  useEffect(() => {
    const db = createAuthClient()
    db.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        db.from("profiles").select("is_premium").eq("id", data.user.id).single()
          .then(({ data: profile }) => setPremium(profile?.is_premium ?? false))
      }
    })
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setPremium(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const db = createAuthClient()
    await db.auth.signOut()
    setUser(null)
    setPremium(false)
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="サイドバーを開閉"
        >
          <Menu size={19} />
        </button>

        <Link href="/" className="flex items-center gap-2 font-black text-slate-950 md:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs text-white">AI</span>
          <span className="text-sm">Certi-AI Hub</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/common/exam?module=MIXED" className="rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">
            混合10問
          </Link>
          <Link href="/sc-module" className="rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-sky-50 hover:text-sky-700">
            SC
          </Link>
          <Link href="/aws-module" className="rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-orange-50 hover:text-orange-700">
            AIF
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/common/exam?module=MIXED" className="hidden h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800 sm:flex">
            <PlayCircle size={15} />
            今日の10問
          </Link>
          {user ? (
            <>
              {premium ? (
                <span className="hidden items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 sm:flex">
                  <Crown size={13} />
                  Premium
                </span>
              ) : (
                <Link href="/pricing" className="hidden rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 sm:block">
                  Premiumへ
                </Link>
              )}
              <button onClick={handleLogout} className="flex h-9 items-center gap-1 rounded-md px-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <LogOut size={15} />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100">
                ログイン
              </Link>
              <Link href="/pricing" className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700">
                Premium
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
