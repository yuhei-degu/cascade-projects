// app/admin/layout.tsx
// 管理画面グループのレイアウト
// middleware.ts で owner チェック済みなのでここでは何もしない

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: '管理画面',
    template: '%s | 管理画面 | RamenFlow',
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // AdminLayout コンポーネントは各 page.tsx 内でラップする方式を採用
  // （page.tsx ごとに title props を渡すため）
  return <>{children}</>
}
