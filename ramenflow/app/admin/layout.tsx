// app/admin/layout.tsx
// 管理画面グループのレイアウト

import type { Metadata } from 'next'

import { requireStaffAuth } from '@/lib/auth/staff'

export const metadata: Metadata = {
  title: {
    default: '管理画面',
    template: '%s | 管理画面 | RamenFlow',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireStaffAuth({ role: 'owner', redirectOnFailure: true })

  return <>{children}</>
}
