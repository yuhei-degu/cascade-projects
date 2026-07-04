'use client'
// app/order/status/[orderId]/page.tsx
// C4: 注文完了・状況表示画面
// リアルタイムで調理状況を表示

import { useParams, useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { useOrderStatus } from '@/hooks/useRealtime'
import { OrderItemStatusBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import type { OrderItemStatus } from '@/lib/types/database'

// ステータス別アイコン
const STATUS_ICON: Record<OrderItemStatus, string> = {
  new:       '⏳',
  cooking:   '🔥',
  ready:     '✨',
  delivered: '✅',
}

// 全体進捗の計算
function getOverallProgress(statuses: OrderItemStatus[]): {
  label: string
  emoji: string
  color: string
} {
  if (statuses.length === 0) return { label: '確認中', emoji: '⏳', color: 'text-gray-400' }
  if (statuses.every(s => s === 'delivered')) return { label: 'お待たせしました！', emoji: '🎉', color: 'text-status-delivered' }
  if (statuses.some(s => s === 'ready'))    return { label: 'まもなくお持ちします', emoji: '✨', color: 'text-status-ready' }
  if (statuses.some(s => s === 'cooking'))  return { label: '調理中です', emoji: '🔥', color: 'text-status-cooking' }
  return { label: '注文を受け付けました', emoji: '⏳', color: 'text-status-new' }
}

export default function OrderStatusPage() {
  const params  = useParams()
  const router  = useRouter()
  const orderId = params.orderId as string

  const { orderItems, isLoading } = useOrderStatus(orderId)

  // テーブル番号を sessionStorage から取得
  const tableNumber = typeof window !== 'undefined'
    ? sessionStorage.getItem('rf_table_number') ?? ''
    : ''

  const statuses  = orderItems.map(i => i.status)
  const progress  = getOverallProgress(statuses)
  const allDone   = statuses.length > 0 && statuses.every(s => s === 'delivered')

  const totalAmount = orderItems.reduce(
    (sum, i) => sum + i.unit_price * i.quantity, 0
  )

  return (
    <CustomerLayout>
      <div className="flex-1 flex flex-col">
        {/* ヒーローエリア: 現在の状況 */}
        <div className="flex-shrink-0 px-6 pt-10 pb-8 text-center">
          {/* 注文完了マーク */}
          {!isLoading && (
            <div className={cn(
              'text-7xl mb-4 transition-all duration-500',
              allDone ? 'animate-bounce' : ''
            )}>
              {progress.emoji}
            </div>
          )}

          {isLoading ? (
            <div className="h-8 w-8 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin mx-auto" />
          ) : (
            <>
              <h1 className={cn(
                'font-serif font-bold text-2xl',
                progress.color
              )}>
                {progress.label}
              </h1>
              {tableNumber && (
                <p className="font-sans text-sm text-brand-dark/50 mt-2">
                  席 {tableNumber}
                </p>
              )}
              <p className="font-sans text-xs text-gray-400 mt-1">
                注文番号: {orderId.slice(-8).toUpperCase()}
              </p>
            </>
          )}
        </div>

        {/* 注文アイテム状況 */}
        {!isLoading && orderItems.length > 0 && (
          <div className="flex-1 px-4 space-y-2 overflow-y-auto">
            <h2 className="font-sans font-bold text-xs text-brand-dark/40 mb-3 tracking-wide">
              ご注文の状況
            </h2>
            {orderItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl border transition-all',
                  item.status === 'delivered'
                    ? 'bg-green-50 border-status-delivered/30'
                    : item.status === 'ready'
                    ? 'bg-yellow-50 border-status-ready/30'
                    : 'bg-white border-gray-100'
                )}
              >
                <span className="text-2xl flex-shrink-0">
                  {STATUS_ICON[item.status]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-brand-dark text-base">
                    {item.menu_item.name}
                  </p>
                  {/* オプション */}
                  {item.selected_options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selected_options.map((opt, i) => (
                        <span key={i} className="text-xs font-sans text-gray-400">
                          {opt.option_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <OrderItemStatusBadge status={item.status} />
                  <p className="font-sans text-xs text-gray-400 mt-1">
                    {formatPrice(item.unit_price)}
                  </p>
                </div>
              </div>
            ))}

            {/* 合計 */}
            <div className="flex items-center justify-between px-4 py-3 bg-brand-cream rounded-2xl mt-2">
              <p className="font-sans font-bold text-brand-dark/60 text-sm">合計</p>
              <p className="font-sans font-black text-brand-dark text-lg">{formatPrice(totalAmount)}</p>
            </div>
          </div>
        )}

        {/* 下部アクション */}
        <div className="px-4 py-6 pb-10 bottom-safe-area space-y-3 mt-4">
          {/* 追加注文ボタン */}
          <button
            onClick={() => router.push(`/order?table=${encodeURIComponent(tableNumber)}`)}
            className={cn(
              'w-full h-14 rounded-2xl font-sans font-bold text-base',
              'border-2 border-brand-dark/20 text-brand-dark',
              'hover:border-brand-dark/40 hover:bg-brand-light transition-all'
            )}
          >
            🍜 追加注文する
          </button>

          {/* ポーリング表示 */}
          {!allDone && (
            <p className="font-sans text-xs text-center text-gray-400">
              状況は自動で更新されます
            </p>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
