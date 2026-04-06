'use client'
// app/staff/orders/page.tsx
// S2: 注文管理ダッシュボード（ホール用）
// Realtimeで全注文を監視・ステータス更新

import { useState, useTransition } from 'react'
import { StaffLayout } from '@/components/layout/StaffLayout'
import { useOrdersRealtime } from '@/hooks/useRealtime'
import { updateOrderItemStatus, clearTable } from '@/actions/staff'
import { OrderItemStatusBadge } from '@/components/ui/Badge'
import { formatPrice, getElapsedMinutes, isOverdue, cn } from '@/lib/utils'
import type { OrderWithItems, OrderItemStatus } from '@/lib/types/database'
import { NEXT_ORDER_ITEM_STATUS, NEXT_ORDER_ITEM_STATUS_LABEL } from '@/lib/types/database'

// ============================================================
// OrderItemRow: 注文アイテム1行
// ============================================================
function OrderItemRow({
  item,
  showNextBtn,
}: {
  item: OrderWithItems['order_items'][number]
  showNextBtn: boolean
}) {
  const [pending, startTransition] = useTransition()
  const nextStatus = NEXT_ORDER_ITEM_STATUS[item.status]
  const nextLabel  = NEXT_ORDER_ITEM_STATUS_LABEL[item.status]

  const handleNext = () => {
    if (!nextStatus) return
    startTransition(async () => {
      await updateOrderItemStatus({ orderItemId: item.id, status: nextStatus })
    })
  }

  return (
    <div className={cn(
      'flex items-center gap-3 py-2.5 px-1',
      item.status === 'delivered' && 'opacity-50'
    )}>
      {/* 商品名 */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-sans font-bold text-lg text-brand-dark',
          item.status === 'delivered' && 'line-through text-gray-400'
        )}>
          {item.menu_item.name}
        </p>
        {(item.selected_options as any[]).length > 0 && (
          <p className="font-sans text-sm text-gray-400 mt-0.5">
            {(item.selected_options as any[]).map((o: any) => o.option_name).join(' / ')}
          </p>
        )}
      </div>

      {/* ステータスバッジ */}
      <OrderItemStatusBadge status={item.status} />

      {/* 次へ進むボタン */}
      {showNextBtn && nextStatus && item.status !== 'delivered' && (
        <button
          onClick={handleNext}
          disabled={pending}
          className={cn(
            'flex-shrink-0 h-12 px-3 rounded-xl font-sans font-bold text-base',
            'border-2 transition-all disabled:opacity-50 min-w-[88px]',
            item.status === 'ready'
              ? 'border-status-delivered text-status-delivered bg-green-50 hover:bg-green-100'
              : 'border-brand-orange text-brand-orange bg-orange-50 hover:bg-orange-100'
          )}
        >
          {pending ? '...' : nextLabel}
        </button>
      )}
    </div>
  )
}

// ============================================================
// OrderCard: 席ごとの注文カード
// ============================================================
function OrderCard({ order }: { order: OrderWithItems }) {
  const [clearing, startClear] = useTransition()
  const [confirmClear, setConfirmClear] = useState(false)

  const elapsedMin    = getElapsedMinutes(order.created_at)
  const overdue       = isOverdue(order.created_at, 5)
  const allDelivered  = order.order_items.every(i => i.status === 'delivered')
  const hasReady      = order.order_items.some(i => i.status === 'ready')

  const handleClearTable = () => {
    startClear(async () => {
      await clearTable(order.table_id)
      setConfirmClear(false)
    })
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl border-2 transition-all',
      overdue && !allDelivered
        ? 'overdue-highlight border-status-alert'
        : hasReady
        ? 'border-status-ready/50 bg-yellow-50/30'
        : 'border-gray-100'
    )}>
      {/* カードヘッダー */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-14 w-14 rounded-xl flex items-center justify-center font-sans font-black text-2xl',
            overdue && !allDelivered
              ? 'bg-status-alert text-white'
              : 'bg-brand-cream text-brand-dark'
          )}>
            {order.table.table_number}
          </div>
          <div>
            <p className="font-sans font-bold text-brand-dark text-xl">席 {order.table.table_number}</p>
            <p className="font-sans text-base text-gray-400">
              {elapsedMin}分前 · {formatPrice(order.total_amount)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdue && !allDelivered && (
            <span className="text-xs font-sans font-bold text-status-alert bg-red-50 px-2 py-1 rounded-full">
              ⚠ {elapsedMin}分経過
            </span>
          )}
        </div>
      </div>

      {/* 注文アイテム */}
      <div className="px-5 divide-y divide-gray-50">
        {order.order_items.map(item => (
          <OrderItemRow
            key={item.id}
            item={item}
            showNextBtn={true}
          />
        ))}
      </div>

      {/* フッター: 清算 */}
      {allDelivered && (
        <div className="px-5 py-4 border-t border-gray-100">
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full h-10 rounded-xl font-sans font-bold text-sm border-2 border-status-delivered text-status-delivered hover:bg-green-50 transition-colors"
            >
              ✓ 清算して席を空ける
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 h-10 rounded-xl font-sans font-semibold text-sm border-2 border-gray-200 text-gray-500"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearTable}
                disabled={clearing}
                className="flex-1 h-10 rounded-xl font-sans font-bold text-sm bg-status-delivered text-white hover:bg-green-700 disabled:opacity-50"
              >
                {clearing ? '処理中...' : '確定'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// S2 メインページ
// ============================================================
export default function StaffOrdersPage() {
  const { orders, isLoading, error } = useOrdersRealtime()

  const newCount      = orders.reduce((s, o) => s + o.order_items.filter(i => i.status === 'new').length, 0)
  const overdueCount  = orders.filter(o => isOverdue(o.created_at, 5) && !o.order_items.every(i => i.status === 'delivered')).length

  return (
    <StaffLayout
      title="注文管理"
      headerRight={
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="text-xs font-sans font-bold bg-status-alert text-white px-2 py-1 rounded-full">
              ⚠ {overdueCount}件
            </span>
          )}
          {newCount > 0 && (
            <span className="text-xs font-sans font-bold bg-status-new text-white px-2 py-1 rounded-full">
              新 {newCount}件
            </span>
          )}
        </div>
      }
    >
      <div className="p-3 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="font-sans text-red-500">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🍜</p>
            <p className="font-sans font-bold text-brand-dark">現在注文はありません</p>
            <p className="font-sans text-sm text-gray-400 mt-1">新しい注文が入ると自動で表示されます</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </StaffLayout>
  )
}
