'use client'
// components/order/OrderStartClient.tsx
// C1: 注文開始画面のクライアント部分
// 席番号を大きく表示し、セッションに保存してメニュー画面へ遷移

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { StoreStatus } from '@/lib/types/database'

const TABLE_TYPE_LABELS: Record<string, string> = {
  counter: 'カウンター席',
  table:   'テーブル席',
  booth:   'ボックス席',
}

interface OrderStartClientProps {
  table: { id: string; table_number: string; table_type: string; status: string }
  storeName: string
  isOpen: boolean
  storeStatus: StoreStatus
}

export function OrderStartClient({
  table,
  storeName,
  isOpen,
  storeStatus,
}: OrderStartClientProps) {
  const router = useRouter()

  const handleStart = () => {
    // セッションストレージにカート情報の起点を保存
    sessionStorage.setItem('rf_table_id', table.id)
    sessionStorage.setItem('rf_table_number', table.table_number)
    router.push('/order/menu')
  }

  // 閉店中
  if (!isOpen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🍜</div>
        <h1 className="font-serif font-bold text-2xl text-brand-dark mb-2">{storeName}</h1>
        <div className="mt-4 px-6 py-3 rounded-2xl bg-gray-100">
          <p className="font-sans font-bold text-gray-500">
            {storeStatus === 'preparing' ? '現在準備中です' : '本日は閉店しました'}
          </p>
          <p className="font-sans text-sm text-gray-400 mt-1">
            {storeStatus === 'preparing'
              ? '間もなく開店いたします。しばらくお待ちください。'
              : 'またのご来店をお待ちしております。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 上部: ブランドエリア */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* 店名 */}
        <p className="font-serif text-brand-dark/60 text-sm mb-6 tracking-widest">
          {storeName}
        </p>

        {/* 席番号 — これが最重要情報 */}
        <div className="relative">
          <div className="w-40 h-40 rounded-full bg-brand-red/10 border-4 border-brand-red/20 flex flex-col items-center justify-center mb-2">
            <p className="font-sans text-xs font-semibold text-brand-dark/50 tracking-wider mb-1">
              お席
            </p>
            <p className="font-sans font-black text-5xl text-brand-dark leading-none">
              {table.table_number}
            </p>
          </div>
        </div>

        <p className="font-sans text-sm text-brand-dark/50 mt-4">
          {TABLE_TYPE_LABELS[table.table_type] ?? ''}
        </p>

        {/* 確認メッセージ */}
        <p className="font-sans text-base text-brand-dark mt-8">
          この席番号は正しいですか？
        </p>
        <p className="font-sans text-xs text-brand-dark/40 mt-1">
          違う場合は隣の席のQRをお試しください
        </p>
      </div>

      {/* 下部: CTAボタン */}
      <div className="p-6 pb-10 bottom-safe-area">
        <button
          onClick={handleStart}
          className={cn(
            'w-full h-16 rounded-2xl font-sans font-black text-xl text-white',
            'bg-brand-red hover:bg-red-700 active:bg-red-800',
            'transition-all duration-150 shadow-lg shadow-brand-red/30',
            'flex items-center justify-center gap-3'
          )}
        >
          <span>🍜</span>
          <span>ご注文はこちら</span>
        </button>
        <p className="font-sans text-xs text-brand-dark/30 text-center mt-3">
          タップするとメニューが表示されます
        </p>
      </div>
    </div>
  )
}
