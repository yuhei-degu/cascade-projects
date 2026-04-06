'use client'
// components/admin/StoreStatusToggle.tsx
// 営業状態の切り替えUI（開店 / 準備中 / 閉店）
// A1ダッシュボード・A4店舗設定で使用

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
    label:       '営業中',
    description: 'お客様のご注文を受け付けています',
    bg:          'bg-green-50 border-status-delivered',
    dot:         'bg-status-delivered',
  },
  preparing: {
    label:       '準備中',
    description: '間もなく開店します',
    bg:          'bg-yellow-50 border-status-ready',
    dot:         'bg-status-ready',
  },
  closed: {
    label:       '閉店',
    description: '本日の営業は終了しました',
    bg:          'bg-gray-50 border-gray-300',
    dot:         'bg-gray-400',
  },
}

// 次の状態への遷移順
const STATUS_CYCLE: StoreStatus[] = ['open', 'preparing', 'closed']

const STATUS_BUTTON_LABELS: Record<StoreStatus, string> = {
  open:      '閉店する',
  preparing: '開店する',
  closed:    '準備中にする',
}

const NEXT_STATUS: Record<StoreStatus, StoreStatus> = {
  open:      'closed',
  preparing: 'open',
  closed:    'preparing',
}

const CONFIRM_MESSAGES: Record<StoreStatus, string> = {
  open:      '閉店してよろしいですか？\nQR注文が受け付けられなくなります。',
  preparing: '開店してよろしいですか？\nQR注文の受け付けを開始します。',
  closed:    '準備中に変更します。',
}

export function StoreStatusToggle({
  currentStatus,
  storeName,
}: StoreStatusToggleProps) {
  const [status, setStatus]     = useState<StoreStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError]       = useState<string | null>(null)

  const config    = STATUS_CONFIG[status]
  const nextStatus = NEXT_STATUS[status]
  const buttonLabel = STATUS_BUTTON_LABELS[status]

  const handleToggle = () => {
    const message = CONFIRM_MESSAGES[status]
    if (!window.confirm(message)) return

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
      {/* 現在の状態表示 */}
      <div
        className={cn(
          'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all',
          config.bg
        )}
      >
        {/* パルスアニメーション（営業中のみ） */}
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

      {/* 3ステータス選択ボタン群 */}
      <div className="grid grid-cols-3 gap-2">
        {STATUS_CYCLE.map((s) => (
          <button
            key={s}
            onClick={() => {
              if (s === status) return
              const msg = CONFIRM_MESSAGES[s === 'open' ? 'preparing' : s === 'preparing' ? 'closed' : 'open']
              // 直接選択の確認
              if (!window.confirm(`「${STATUS_CONFIG[s].label}」に変更します。よろしいですか？`)) return
              startTransition(async () => {
                setError(null)
                const result = await updateStoreStatus(s)
                if ('error' in result) { setError(result.error); return }
                setStatus(s)
              })
            }}
            disabled={isPending}
            className={cn(
              'h-12 rounded-xl font-sans font-semibold text-sm transition-all',
              'border-2 disabled:opacity-50 disabled:cursor-not-allowed',
              status === s
                ? cn('border-brand-red bg-brand-red text-white')
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-brand-dark'
            )}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* エラー */}
      {error && (
        <p className="text-sm font-sans text-red-600 bg-red-50 rounded-xl px-4 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
