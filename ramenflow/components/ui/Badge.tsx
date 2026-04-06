// components/ui/Badge.tsx
// ステータスバッジ群（単体ファイル）

import { cn } from '@/lib/utils'
import {
  ORDER_ITEM_STATUS_LABELS,
  ORDER_ITEM_STATUS_COLORS,
  TABLE_STATUS_LABELS,
  TABLE_STATUS_COLORS,
  STORE_STATUS_LABELS,
} from '@/lib/types/database'
import type { OrderItemStatus, TableStatus, StoreStatus } from '@/lib/types/database'

export function OrderItemStatusBadge({
  status,
  className,
}: {
  status: OrderItemStatus
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-semibold',
      ORDER_ITEM_STATUS_COLORS[status],
      className
    )}>
      {ORDER_ITEM_STATUS_LABELS[status]}
    </span>
  )
}

export function TableStatusBadge({
  status,
  className,
}: {
  status: TableStatus
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-sans font-semibold border',
      TABLE_STATUS_COLORS[status],
      className
    )}>
      {TABLE_STATUS_LABELS[status]}
    </span>
  )
}

export function StoreStatusBanner({ status }: { status: StoreStatus }) {
  const bg: Record<StoreStatus, string> = {
    open:      'bg-status-delivered text-white',
    preparing: 'bg-status-ready text-brand-dark',
    closed:    'bg-gray-400 text-white',
  }
  return (
    <div className={cn('w-full py-2 px-4 text-center text-sm font-sans font-semibold', bg[status])}>
      {STORE_STATUS_LABELS[status]}
    </div>
  )
}

export function SoldOutBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 text-gray-500 text-xs font-sans font-semibold">
      売り切れ
    </span>
  )
}
