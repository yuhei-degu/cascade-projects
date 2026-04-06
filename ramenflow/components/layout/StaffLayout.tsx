'use client'
// components/layout/StaffLayout.tsx
// スタッフ向け画面（S1〜S4）共通レイアウト
// 下部ナビゲーション + ヘッダー
// タブレット横置き・スマホ縦向き両対応

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  /** badge に表示する数字（0 の場合は非表示） */
  badgeCount?: number
}

interface StaffLayoutProps {
  children: React.ReactNode
  title: string
  /** タイトル右側に置くアクション要素（任意） */
  headerRight?: React.ReactNode
}

// ---- アイコン（SVG インライン・外部ライブラリ不使用） ----
function OrdersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

function KitchenIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  )
}

function TablesIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { href: '/staff/orders',  label: '注文管理', icon: <OrdersIcon /> },
  { href: '/staff/kitchen', label: '厨房',     icon: <KitchenIcon /> },
  { href: '/staff/tables',  label: '席一覧',   icon: <TablesIcon /> },
]

export function StaffLayout({ children, title, headerRight }: StaffLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* ---- ヘッダー ---- */}
      <header className="sticky top-0 z-20 bg-brand-dark text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            {/* ロゴマーク */}
            <span className="text-brand-orange font-bold text-lg font-serif">🍜</span>
            <h1 className="text-base font-bold text-white">{title}</h1>
          </div>
          {headerRight && (
            <div className="flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </div>
      </header>

      {/* ---- メインコンテンツ ---- */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* ---- 下部ナビゲーション ---- */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 bottom-safe-area"
        aria-label="スタッフナビゲーション"
      >
        <ul className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1',
                    'min-h-[68px] w-full py-2 px-1',
                    'transition-colors duration-150',
                    isActive
                      ? 'text-brand-red'
                      : 'text-gray-400 hover:text-brand-dark'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* アイコン */}
                  <div className="relative">
                    {item.icon}
                    {/* バッジ（新規注文数など） */}
                    {item.badgeCount != null && item.badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badgeCount > 9 ? '9+' : item.badgeCount}
                      </span>
                    )}
                  </div>
                  {/* ラベル */}
                  <span className={cn(
                    'text-sm font-bold leading-none',
                    isActive ? 'text-brand-red' : 'text-gray-400'
                  )}>
                    {item.label}
                  </span>
                  {/* アクティブインジケーター */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-red rounded-full" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
