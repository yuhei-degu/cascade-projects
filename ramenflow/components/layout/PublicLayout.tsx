// components/layout/PublicLayout.tsx
// ホームページ（H1〜H3）共通レイアウト
// 来店前の客向け・モバイルファースト・ブランドを前面に出す

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PublicLayoutProps {
  children: React.ReactNode
}

const NAV_LINKS = [
  { href: '/',       label: 'トップ' },
  { href: '/menu',   label: 'メニュー' },
  { href: '/about',  label: '店舗情報' },
]

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-cream font-serif flex flex-col">
      {/* ---- ヘッダー ---- */}
      <header className="sticky top-0 z-20 bg-brand-cream/95 backdrop-blur-sm border-b border-brand-dark/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* ロゴ */}
          <Link
            href="/"
            className="flex items-center gap-2 text-brand-dark hover:opacity-80 transition-opacity"
          >
            <span className="text-brand-red text-xl" aria-hidden="true">🍜</span>
            <span className="font-bold text-lg font-serif">ラーメン店</span>
          </Link>

          {/* ナビゲーション */}
          <nav aria-label="メインナビゲーション">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'px-3 py-1.5 text-sm font-sans font-medium rounded-full transition-colors',
                      'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-light'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* ---- メインコンテンツ ---- */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* ---- フッター ---- */}
      <footer className="border-t border-brand-dark/10 py-6 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs font-sans text-brand-dark/40">
            © {new Date().getFullYear()} ラーメン店 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
