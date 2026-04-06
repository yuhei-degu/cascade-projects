// app/order/page.tsx
// C1: 注文開始画面
// QRコード読み取り後のランディングページ
// URL: /order?table=A1

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { OrderStartClient } from '@/components/order/OrderStartClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'ご注文' }

interface PageProps {
  searchParams: Promise<{ table?: string }>
}

export default async function OrderPage({ searchParams }: PageProps) {
  const { table: tableNumber } = await searchParams

  // table パラメータがない場合はホームへ
  if (!tableNumber) {
    redirect('/')
  }

  const supabase = await createClient()

  // 席情報を取得
  const { data: table } = await supabase
    .from('tables')
    .select('id, table_number, table_type, status')
    .eq('table_number', tableNumber)
    .single()

  // 存在しない席番号の場合
  if (!table) {
    return (
      <CustomerLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-5xl mb-4">😥</p>
          <h1 className="font-serif font-bold text-xl text-brand-dark mb-2">
            席が見つかりません
          </h1>
          <p className="font-sans text-sm text-brand-dark/60">
            QRコードを読み取り直すか、<br />スタッフにお声がけください。
          </p>
        </div>
      </CustomerLayout>
    )
  }

  // 店舗の営業状態を確認
  const { data: settings } = await supabase
    .from('store_settings')
    .select('is_open, status, store_name')
    .single()

  return (
    <CustomerLayout>
      <OrderStartClient
        table={table}
        storeName={settings?.store_name ?? 'ラーメン店'}
        isOpen={settings?.is_open ?? false}
        storeStatus={settings?.status ?? 'closed'}
      />
    </CustomerLayout>
  )
}
