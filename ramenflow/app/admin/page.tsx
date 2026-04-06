// app/admin/page.tsx
// A1: 管理トップ（ダッシュボード）
// 今日の概況 + クイックリンク集

import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StoreStatusToggle } from '@/components/admin/StoreStatusToggle'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import type { StoreStatus } from '@/lib/types/database'

// 30秒ごとに再検証（ダッシュボードは若干の遅延は許容）
export const revalidate = 30

async function getDashboardData() {
  const supabase = await createClient()

  const [settingsRes, tablesRes, ordersRes] = await Promise.all([
    supabase.from('store_settings').select('*').single(),
    supabase.from('tables').select('id, status'),
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  const tables = tablesRes.data ?? []
  const orders = ordersRes.data ?? []

  const emptyCount    = tables.filter(t => t.status === 'empty').length
  const occupiedCount = tables.filter(t => t.status === 'occupied').length
  const totalCount    = tables.length

  const todaySales      = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total_amount, 0)
  const activeOrders    = orders.filter(o => o.status === 'active').length
  const completedOrders = orders.filter(o => o.status === 'completed').length

  return {
    settings: settingsRes.data,
    emptyCount,
    occupiedCount,
    totalCount,
    todaySales,
    activeOrders,
    completedOrders,
  }
}

// ---- クイックリンクカード ----
function QuickLinkCard({
  href,
  emoji,
  label,
  description,
}: {
  href: string
  emoji: string
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-red/30 transition-all group"
    >
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="font-sans font-bold text-brand-dark group-hover:text-brand-red transition-colors">
          {label}
        </p>
        <p className="font-sans text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <span className="ml-auto text-gray-300 group-hover:text-brand-red transition-colors">›</span>
    </Link>
  )
}

// ---- 数字カード ----
function StatCard({
  label,
  value,
  sub,
  color = 'default',
}: {
  label: string
  value: string
  sub?: string
  color?: 'default' | 'green' | 'orange' | 'red'
}) {
  const colorMap = {
    default: 'text-brand-dark',
    green:   'text-status-delivered',
    orange:  'text-status-cooking',
    red:     'text-status-alert',
  }
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="font-sans text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-sans font-bold text-2xl ${colorMap[color]}`}>{value}</p>
      {sub && <p className="font-sans text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboardPage() {
  const {
    settings,
    emptyCount,
    occupiedCount,
    totalCount,
    todaySales,
    activeOrders,
    completedOrders,
  } = await getDashboardData()

  return (
    <AdminLayout title="ダッシュボード">
      <div className="space-y-6 max-w-2xl">

        {/* ---- 営業状態スイッチ ---- */}
        <section>
          <h2 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wide mb-3">
            営業状態
          </h2>
          <StoreStatusToggle
            currentStatus={(settings?.status ?? 'closed') as StoreStatus}
            storeName={settings?.store_name ?? 'ラーメン店'}
          />
        </section>

        {/* ---- 今日の概況 ---- */}
        <section>
          <h2 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wide mb-3">
            本日の概況
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="空席 / 総席数"
              value={`${emptyCount} / ${totalCount}`}
              sub={`使用中 ${occupiedCount}席`}
              color={emptyCount > 0 ? 'green' : 'red'}
            />
            <StatCard
              label="対応中の注文"
              value={`${activeOrders}件`}
              color={activeOrders > 0 ? 'orange' : 'default'}
            />
            <StatCard
              label="本日の完了注文"
              value={`${completedOrders}件`}
            />
            <StatCard
              label="本日の売上（概算）"
              value={formatPrice(todaySales)}
              color="green"
            />
          </div>
        </section>

        {/* ---- クイックリンク ---- */}
        <section>
          <h2 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wide mb-3">
            管理メニュー
          </h2>
          <div className="space-y-2">
            <QuickLinkCard
              href="/admin/menu"
              emoji="🍜"
              label="メニュー管理"
              description="商品の追加・編集・売り切れ設定"
            />
            <QuickLinkCard
              href="/admin/tables"
              emoji="🪑"
              label="席・QRコード管理"
              description="席の登録・QRコードの生成と印刷"
            />
            <QuickLinkCard
              href="/admin/settings"
              emoji="⚙️"
              label="店舗設定"
              description="スタッフ人数・営業情報の設定"
            />
            <QuickLinkCard
              href="/admin/staff"
              emoji="👤"
              label="スタッフ管理"
              description="スタッフアカウントの管理"
            />
            <QuickLinkCard
              href="/staff/orders"
              emoji="📋"
              label="注文管理画面へ"
              description="スタッフ向けの注文管理・厨房ビュー"
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
