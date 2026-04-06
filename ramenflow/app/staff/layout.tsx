// app/staff/layout.tsx
// スタッフエリアのレイアウトラッパー
// middleware.ts で認証済みのため、ここでは何もしない

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'スタッフ画面',
    template: '%s | スタッフ | RamenFlow',
  },
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
