// app/page.tsx
// H1: ホームページトップ
// 来店前の客向け: 待ち時間・空席・営業状態をリアルタイム表示

import { createClient } from '@/lib/supabase/server'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { HeroSection } from '@/components/home/HeroSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ラーメン店 | 現在の混雑状況',
  description: '現在の待ち時間・空席状況をリアルタイムでご確認いただけます。',
}

// SSR + クライアントのRealtimeで更新
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const [settingsRes, tablesRes] = await Promise.all([
    supabase.from('store_settings').select('*').single(),
    supabase.from('tables').select('id, status'),
  ])

  const settings    = settingsRes.data
  const tables      = tablesRes.data ?? []
  const emptyCount  = tables.filter(t => t.status === 'empty').length
  const totalCount  = tables.length

  return (
    <PublicLayout>
      <HeroSection
        initialSettings={settings}
        emptyCount={emptyCount}
        totalCount={totalCount}
      />
    </PublicLayout>
  )
}
