'use client'
// components/home/HeroSection.tsx
// H1ホームページのヒーローエリア
// 待ち時間・空席・営業状態を大きく表示。Realtimeで自動更新。

import Link from 'next/link'
import { useStoreSettingsRealtime } from '@/hooks/useRealtime'
import { formatWaitTime, getCrowdLevel, CROWD_LEVEL_LABELS, CROWD_LEVEL_COLORS } from '@/lib/wait-time'
import { cn } from '@/lib/utils'
import type { StoreSettings } from '@/lib/types/database'

const STORE_STATUS_CONFIG = {
  open:      { label: '営業中',       bg: 'bg-status-delivered', dot: true },
  preparing: { label: '準備中',       bg: 'bg-status-ready',     dot: false },
  closed:    { label: '本日は閉店',   bg: 'bg-gray-400',         dot: false },
}

interface HeroSectionProps {
  initialSettings: StoreSettings | null
  emptyCount:  number
  totalCount:  number
}

// 空席インジケーター（ドット表示）
function OccupancyDots({ empty, total }: { empty: number; total: number }) {
  if (total === 0) return null
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 w-4 rounded-full border-2 transition-all',
            i < (total - empty)
              ? 'bg-status-alert border-status-alert'
              : 'bg-white border-status-delivered'
          )}
        />
      ))}
    </div>
  )
}

export function HeroSection({ initialSettings, emptyCount, totalCount }: HeroSectionProps) {
  const { settings: liveSettings } = useStoreSettingsRealtime()
  const settings = liveSettings ?? initialSettings

  const isOpen    = settings?.is_open ?? false
  const status    = settings?.status ?? 'closed'
  const waitMin   = settings?.estimated_wait_minutes ?? 0
  const storeName = settings?.store_name ?? 'ラーメン店'

  const waitText    = formatWaitTime(waitMin, isOpen)
  const crowdLevel  = isOpen ? getCrowdLevel(waitMin) : 'low'
  const statusCfg   = STORE_STATUS_CONFIG[status]

  return (
    <div className="space-y-6">
      {/* 営業状態バナー */}
      <div className={cn(
        'flex items-center justify-center gap-2 py-2 px-4 rounded-full text-white text-sm font-sans font-bold',
        statusCfg.bg
      )}>
        {statusCfg.dot && (
          <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
        )}
        {statusCfg.label}
      </div>

      {/* 店名 */}
      <div className="text-center">
        <h1 className="font-serif font-bold text-3xl text-brand-dark">{storeName}</h1>
      </div>

      {/* ---- メインヒーロー: 待ち時間 ---- */}
      {isOpen ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
          <p className="font-sans text-sm font-semibold text-gray-400 tracking-wide mb-3">
            現在の待ち時間
          </p>
          <p className={cn(
            'font-serif font-bold text-2xl leading-snug',
            CROWD_LEVEL_COLORS[crowdLevel]
          )}>
            {waitText || 'ただいますぐご案内できます'}
          </p>

          {/* 混雑度ラベル */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cream">
            <span className={cn('font-sans font-bold text-sm', CROWD_LEVEL_COLORS[crowdLevel])}>
              {CROWD_LEVEL_LABELS[crowdLevel]}
            </span>
          </div>

          {/* 空席情報 */}
          {totalCount > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="font-sans text-sm text-gray-400 mb-2">空席状況</p>
              <p className="font-sans font-bold text-brand-dark">
                <span className={cn(
                  'text-2xl font-black',
                  emptyCount > 0 ? 'text-status-delivered' : 'text-status-alert'
                )}>
                  {emptyCount}
                </span>
                <span className="text-gray-400 text-base"> / {totalCount}席</span>
              </p>
              <OccupancyDots empty={emptyCount} total={Math.min(totalCount, 16)} />
            </div>
          )}
        </div>
      ) : (
        /* 閉店時 */
        <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-200">
          <p className="text-5xl mb-4">🌙</p>
          <p className="font-serif font-bold text-xl text-gray-500">
            {status === 'preparing' ? '間もなく開店いたします' : '本日の営業は終了しました'}
          </p>
          <p className="font-sans text-sm text-gray-400 mt-2">
            またのご来店をお待ちしております
          </p>
        </div>
      )}

      {/* CTA ボタン群 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/menu"
          className={cn(
            'flex flex-col items-center justify-center gap-1',
            'h-20 rounded-2xl border-2 border-brand-dark/10',
            'bg-white hover:bg-brand-cream transition-colors',
            'font-sans font-bold text-brand-dark'
          )}
        >
          <span className="text-2xl">🍜</span>
          <span className="text-sm">メニューを見る</span>
        </Link>
        <Link
          href="/about"
          className={cn(
            'flex flex-col items-center justify-center gap-1',
            'h-20 rounded-2xl border-2 border-brand-dark/10',
            'bg-white hover:bg-brand-cream transition-colors',
            'font-sans font-bold text-brand-dark'
          )}
        >
          <span className="text-2xl">📍</span>
          <span className="text-sm">アクセス・店舗情報</span>
        </Link>
      </div>

      {/* 自動更新の説明 */}
      <p className="font-sans text-xs text-center text-gray-400">
        待ち時間・空席情報は自動で更新されます
      </p>
    </div>
  )
}
