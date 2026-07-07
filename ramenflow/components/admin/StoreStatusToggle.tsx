'use client'

import { useState, useTransition } from 'react'
import { updateStoreStatus } from '@/actions/settings'
import type { StoreStatus } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface StoreStatusToggleProps {
  currentStatus: StoreStatus
  storeName: string
}

const STATUS_CONFIG: Record<
  StoreStatus,
  { label: string; description: string; bg: string; dot: string }
> = {
  open: {
    label: '営業中',
    description: 'お客様の注文を受け付けています',
    bg: 'bg-green-50 border-status-delivered',
    dot: 'bg-status-delivered',
  },
  preparing: {
    label: '準備中',
    description: '開店前の準備中です',
    bg: 'bg-yellow-50 border-status-ready',
    dot: 'bg-status-ready',
  },
  closed: {
    label: '閉店',
    description: '本日の営業は終了しました',
    bg: 'bg-gray-50 border-gray-300',
    dot: 'bg-gray-400',
  },
}

const STATUS_CYCLE: StoreStatus[] = ['open', 'preparing', 'closed']

export function StoreStatusToggle({
  currentStatus,
  storeName,
}: StoreStatusToggleProps) {
  const [status, setStatus] = useState<StoreStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const config = STATUS_CONFIG[status]

  const handleSelectStatus = (nextStatus: StoreStatus) => {
    if (nextStatus === status) return
    if (!window.confirm(`「${STATUS_CONFIG[nextStatus].label}」に変更します。よろしいですか？`)) return

    startTransition(async () => {
      setError(null)
      const result = await updateStoreStatus(nextStatus)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setStatus(nextStatus)
    })
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all',
          config.bg
        )}
      >
        <div className="relative flex-shrink-0">
          <div className={cn('h-4 w-4 rounded-full', config.dot)} />
          {status === 'open' && (
            <div className={cn(
              'absolute inset-0 h-4 w-4 rounded-full animate-ping opacity-60',
              config.dot
            )} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-brand-dark text-lg leading-tight">
            {storeName}
          </p>
          <p className="font-sans font-bold text-base text-gray-600">
            {config.label}
          </p>
          <p className="font-sans text-sm text-gray-400 mt-0.5">
            {config.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STATUS_CYCLE.map((nextStatus) => (
          <button
            key={nextStatus}
            onClick={() => handleSelectStatus(nextStatus)}
            disabled={isPending}
            className={cn(
              'h-12 rounded-xl font-sans font-semibold text-sm transition-all',
              'border-2 disabled:opacity-50 disabled:cursor-not-allowed',
              status === nextStatus
                ? 'border-brand-red bg-brand-red text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-brand-dark'
            )}
          >
            {STATUS_CONFIG[nextStatus].label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm font-sans text-red-600 bg-red-50 rounded-xl px-4 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
