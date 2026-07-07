'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { useOrderStatus } from '@/hooks/useRealtime'
import { OrderItemStatusBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import type { OrderItemStatus } from '@/lib/types/database'

const STATUS_ICON: Record<OrderItemStatus, string> = {
  new: '受付',
  cooking: '調理',
  ready: '提供',
  delivered: '完了',
}

function getOverallProgress(statuses: OrderItemStatus[]): {
  label: string
  mark: string
  color: string
} {
  if (statuses.length === 0) return { label: '注文内容を確認しています', mark: '確認中', color: 'text-gray-400' }
  if (statuses.every(status => status === 'delivered')) {
    return { label: 'お渡ししました', mark: '完了', color: 'text-status-delivered' }
  }
  if (statuses.some(status => status === 'ready')) {
    return { label: 'まもなくお持ちします', mark: '提供', color: 'text-status-ready' }
  }
  if (statuses.some(status => status === 'cooking')) {
    return { label: '調理中です', mark: '調理中', color: 'text-status-cooking' }
  }
  return { label: '注文を受け付けました', mark: '受付済', color: 'text-status-new' }
}

function CustomerErrorPage({
  message,
  onRestart,
}: {
  message: string
  onRestart: () => void
}) {
  return (
    <CustomerLayout title="エラー">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full rounded-2xl bg-white border border-red-100 p-6 text-center shadow-sm">
          <p className="text-4xl mb-4">!</p>
          <h1 className="font-sans font-black text-xl text-brand-dark mb-3">
            注文情報を確認できません
          </h1>
          <p className="font-sans text-sm leading-6 text-brand-dark/60">
            {message}
          </p>
          <button
            onClick={onRestart}
            className="mt-6 w-full h-12 rounded-2xl bg-brand-red text-white font-sans font-bold"
          >
            最初からやり直す
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default function OrderStatusPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [tableId, setTableId] = useState('')
  const [hasLoadedSession, setHasLoadedSession] = useState(false)

  useEffect(() => {
    setTableId(sessionStorage.getItem('rf_table_id') ?? '')
    setHasLoadedSession(true)
  }, [])

  const { orderItems, tableNumber, isLoading, error } = useOrderStatus(orderId, tableId)

  if (hasLoadedSession && !tableId) {
    return (
      <CustomerErrorPage
        message="席情報を確認できませんでした。QRコードを読み取り直して、もう一度お試しください。"
        onRestart={() => router.replace('/')}
      />
    )
  }

  if (error) {
    return (
      <CustomerErrorPage
        message={error}
        onRestart={() => router.replace('/')}
      />
    )
  }

  const statuses = orderItems.map(item => item.status)
  const progress = getOverallProgress(statuses)
  const allDone = statuses.length > 0 && statuses.every(status => status === 'delivered')
  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  )

  return (
    <CustomerLayout>
      <div className="flex-1 flex flex-col">
        <div className="flex-shrink-0 px-6 pt-10 pb-8 text-center">
          {!isLoading && (
            <div className={cn(
              'inline-flex items-center justify-center min-w-24 h-24 rounded-full px-5 mb-4 font-sans font-black text-lg bg-white shadow-sm border',
              allDone ? 'border-status-delivered/30 text-status-delivered' : 'border-brand-dark/10 text-brand-dark'
            )}>
              {progress.mark}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin" />
              <p className="font-sans text-sm text-brand-dark/50">注文状況を読み込んでいます</p>
            </div>
          ) : (
            <>
              <h1 className={cn('font-serif font-bold text-2xl', progress.color)}>
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

        {!isLoading && orderItems.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full rounded-2xl bg-white border border-gray-100 p-6 text-center shadow-sm">
              <p className="font-sans font-bold text-brand-dark mb-2">表示できる注文がありません</p>
              <p className="font-sans text-sm text-brand-dark/50">
                注文がまだ反映されていない場合は、少し時間をおいて自動更新をお待ちください。
              </p>
            </div>
          </div>
        )}

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
                <span className="w-12 flex-shrink-0 text-center text-xs font-sans font-bold text-brand-dark/50">
                  {STATUS_ICON[item.status]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-brand-dark text-base">
                    {item.menu_item.name}
                  </p>
                  {item.selected_options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selected_options.map((option, index) => (
                        <span key={index} className="text-xs font-sans text-gray-400">
                          {option.option_name}
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

            <div className="flex items-center justify-between px-4 py-3 bg-brand-cream rounded-2xl mt-2">
              <p className="font-sans font-bold text-brand-dark/60 text-sm">合計</p>
              <p className="font-sans font-black text-brand-dark text-lg">{formatPrice(totalAmount)}</p>
            </div>
          </div>
        )}

        <div className="px-4 py-6 pb-10 bottom-safe-area space-y-3 mt-4">
          <button
            onClick={() => router.push(`/order?table=${encodeURIComponent(tableNumber)}`)}
            className={cn(
              'w-full h-14 rounded-2xl font-sans font-bold text-base',
              'border-2 border-brand-dark/20 text-brand-dark',
              'hover:border-brand-dark/40 hover:bg-brand-light transition-all'
            )}
          >
            追加で注文する
          </button>

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
