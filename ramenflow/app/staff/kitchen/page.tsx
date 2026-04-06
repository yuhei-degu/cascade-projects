'use client'
// app/staff/kitchen/page.tsx
// S3: 厨房ビュー
// 調理すべき商品を時系列・大文字で表示
// 厨房環境（油・水・遠距離）に最適化したUI

import { useTransition } from 'react'
import { StaffLayout } from '@/components/layout/StaffLayout'
import { useOrdersRealtime } from '@/hooks/useRealtime'
import { updateOrderItemStatus } from '@/actions/staff'
import { cn, getElapsedMinutes } from '@/lib/utils'
import type { OrderItemStatus } from '@/lib/types/database'

// 厨房ビュー用の統合アイテム型
interface KitchenQueueItem {
  id: string
  menuItemName: string
  tableNumber: string
  status: OrderItemStatus
  orderCreatedAt: string
  selectedOptions: { option_name: string }[]
}

// ============================================================
// KitchenItem: 調理待ち1件（大きなボタンUI）
// ============================================================
function KitchenItem({ item }: { item: KitchenQueueItem }) {
  const [pending, startTransition] = useTransition()
  const elapsed = getElapsedMinutes(item.orderCreatedAt)
  const isCooking = item.status === 'cooking'

  const handleNext = () => {
    const nextStatus: OrderItemStatus = isCooking ? 'ready' : 'cooking'
    startTransition(async () => {
      await updateOrderItemStatus({ orderItemId: item.id, status: nextStatus })
    })
  }

  return (
    <div className={cn(
      'rounded-2xl border-2 p-4 transition-all',
      isCooking
        ? 'bg-orange-50 border-status-cooking'
        : 'bg-white border-gray-200'
    )}>
      {/* 席番号 + 経過時間 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-sans font-black text-3xl px-4 py-2 rounded-xl',
            isCooking ? 'bg-status-cooking text-white' : 'bg-brand-cream text-brand-dark'
          )}>
            {item.tableNumber}
          </span>
          {isCooking && (
            <span className="font-sans text-sm font-bold text-status-cooking animate-pulse">
              🔥 調理中
            </span>
          )}
        </div>
        <span className={cn(
          'font-sans text-lg font-semibold',
          elapsed >= 10 ? 'text-status-alert' : 'text-gray-400'
        )}>
          {elapsed}分待ち
        </span>
      </div>

      {/* 商品名 — 最重要: 大きなフォント */}
      <p className="font-sans font-black text-3xl text-brand-dark mb-1">
        {item.menuItemName}
      </p>

      {/* オプション */}
      {item.selectedOptions.length > 0 && (
        <p className="font-sans text-lg text-gray-500 mb-3">
          {item.selectedOptions.map(o => o.option_name).join(' · ')}
        </p>
      )}

      {/* アクションボタン — 最低 72px 以上 */}
      <button
        onClick={handleNext}
        disabled={pending}
        className={cn(
          'w-full rounded-xl font-sans font-black text-2xl text-white',
          'min-h-[72px] transition-all disabled:opacity-50',
          'active:scale-[0.98]',
          isCooking
            ? 'bg-status-delivered hover:bg-green-700 shadow-md shadow-green-200'
            : 'bg-status-cooking hover:bg-orange-600 shadow-md shadow-orange-200'
        )}
      >
        {pending ? '...' : isCooking ? '✓ 調理完了' : '▶ 調理開始'}
      </button>
    </div>
  )
}

// ============================================================
// S3 メインページ
// ============================================================
export default function StaffKitchenPage() {
  const { orders, isLoading } = useOrdersRealtime()

  // cooking / new のアイテムを抽出・統合
  const kitchenItems: KitchenQueueItem[] = orders.flatMap(order =>
    order.order_items
      .filter(i => i.status === 'new' || i.status === 'cooking')
      .map(i => ({
        id:              i.id,
        menuItemName:    i.menu_item.name,
        tableNumber:     order.table.table_number,
        status:          i.status,
        orderCreatedAt:  order.created_at,
        selectedOptions: i.selected_options as { option_name: string }[],
      }))
  )

  // cooking を優先、次に new、同じステータス内は時間順
  const sortedItems = [...kitchenItems].sort((a, b) => {
    if (a.status === 'cooking' && b.status !== 'cooking') return -1
    if (a.status !== 'cooking' && b.status === 'cooking') return 1
    return new Date(a.orderCreatedAt).getTime() - new Date(b.orderCreatedAt).getTime()
  })

  const cookingCount = kitchenItems.filter(i => i.status === 'cooking').length
  const waitingCount = kitchenItems.filter(i => i.status === 'new').length

  return (
    <StaffLayout
      title="厨房"
      headerRight={
        <div className="flex gap-2 text-xs font-sans font-bold">
          {cookingCount > 0 && (
            <span className="bg-status-cooking text-white px-2 py-1 rounded-full">
              調理中 {cookingCount}
            </span>
          )}
          {waitingCount > 0 && (
            <span className="bg-status-new text-white px-2 py-1 rounded-full">
              待ち {waitingCount}
            </span>
          )}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin" />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">✅</p>
            <p className="font-sans font-black text-xl text-status-delivered">
              調理待ちはありません
            </p>
            <p className="font-sans text-sm text-gray-400 mt-2">
              新しい注文が入ると自動で表示されます
            </p>
          </div>
        ) : (
          sortedItems.map(item => (
            <KitchenItem key={item.id} item={item} />
          ))
        )}
      </div>
    </StaffLayout>
  )
}
