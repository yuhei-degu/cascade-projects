// components/layout/CustomerLayout.tsx
// 客向け画面（C1〜C4）共通レイアウト
// スマホ縦向け前提・最大幅 430px・和風ブランド感

interface CustomerLayoutProps {
  children: React.ReactNode
  /** ページタイトル（ヘッダーに表示・省略可） */
  title?: string
  /** 戻るボタンのコールバック（省略時は非表示） */
  onBack?: () => void
}

export function CustomerLayout({
  children,
  title,
  onBack,
}: CustomerLayoutProps) {
  return (
    <div className="customer-container bg-brand-cream flex flex-col">
      {/* ヘッダー（タイトルまたは戻るボタンがある場合のみ表示） */}
      {(title || onBack) && (
        <header className="sticky top-0 z-20 bg-brand-cream/95 backdrop-blur-sm border-b border-brand-dark/10">
          <div className="flex items-center h-14 px-4 gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-brand-light active:bg-amber-100 transition-colors"
                aria-label="戻る"
              >
                {/* 左矢印 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-brand-dark"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            {title && (
              <h1 className="flex-1 text-lg font-bold font-serif text-brand-dark truncate">
                {title}
              </h1>
            )}
          </div>
        </header>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
