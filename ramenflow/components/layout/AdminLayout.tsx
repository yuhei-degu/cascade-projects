'use client'
// components/layout/AdminLayout.tsx
// 管理者画面（A1〜A5）共通レイアウト
// PC/タブレット: サイドバー + コンテンツ
// スマホ: 上部タブナビ

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

const NAV_ITEMS = [
  { href: '/admin',          label: 'ダッシュボード', emoji: '📊' },
  { href: '/admin/menu',     label: 'メニュー管理',   emoji: '🍜' },
  { href: '/admin/tables',   label: '席・QR管理',     emoji: '🪑' },
  { href: '/admin/settings', label: '店舗設定',       emoji: '⚙️' },
  { href: '/admin/staff',    label: 'スタッフ管理',   emoji: '👤' },
]

function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/staff/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-brand-red transition-colors"
    >
      <span>🚪</span>
      <span>ログアウト</span>
    </button>
  )
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ---- モバイル: 上部ヘッダー + タブ ---- */}
      <div className="lg:hidden">
        <header className="bg-brand-dark text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-brand-orange text-xl">🍜</span>
            <span className="font-bold text-sm">管理画面</span>
          </div>
          <Link
            href="/staff/orders"
            className="text-xs text-white/70 underline"
          >
            スタッフ画面へ
          </Link>
        </header>

        {/* スクロール可能なタブ */}
        <nav className="bg-white border-b border-gray-200 overflow-x-auto">
          <ul className="flex min-w-max">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-4 text-base font-bold whitespace-nowrap border-b-2 transition-colors',
                      isActive
                        ? 'border-brand-red text-brand-red'
                        : 'border-transparent text-gray-500 hover:text-brand-dark'
                    )}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* コンテンツ */}
        <main className="p-4">
          <h1 className="text-xl font-bold text-brand-dark mb-4">{title}</h1>
          {children}
        </main>
      </div>

      {/* ---- デスクトップ/タブレット: サイドバー ---- */}
      <div className="hidden lg:flex min-h-screen">
        {/* サイドバー */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 bottom-0">
          {/* ロゴ */}
          <div className="px-4 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-brand-orange text-2xl">🍜</span>
              <div>
                <p className="font-bold text-brand-dark text-sm">RamenFlow</p>
                <p className="text-xs text-gray-400">管理画面</p>
              </div>
            </div>
          </div>

          {/* ナビ */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3.5 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-red-50 text-brand-red font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-dark'
                  )}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* スタッフ画面リンク + ログアウト */}
          <div className="p-3 border-t border-gray-100 space-y-1">
            <Link
              href="/staff/orders"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-brand-dark transition-colors"
            >
              <span>↩️</span>
              <span>スタッフ画面へ</span>
            </Link>
            <LogoutButton />
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 ml-64 p-10">
          <h1 className="text-3xl font-bold text-brand-dark mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  )
}
