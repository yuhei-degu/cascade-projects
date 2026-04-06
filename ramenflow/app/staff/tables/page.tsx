'use client'
// app/staff/tables/page.tsx
// S4: 席状況一覧
// 全席の使用状況をグリッドで俯瞰する

import { useTransition } from 'react'
import { StaffLayout } from '@/components/layout/StaffLayout'
import { useTablesRealtime } from '@/hooks/useRealtime'
import { updateTableStatus, clearTable } from '@/actions/staff'
import { cn } from '@/lib/utils'
import type { Table, TableStatus } from '@/lib/types/database'

// ---- ステータス設定 ----
const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  empty: {
    label:  '空席',
    emoji:  '○',
    bg:     'bg-green-50',
    text:   'text-status-delivered',
    border: 'border-status-delivered/40',
  },
  occupied: {
    label:  '使用中',
    emoji:  '●',
    bg:     'bg-red-50',
    text:   'text-status-alert',
    border: 'border-status-alert/40',
  },
  billing: {
    label:  '会計待',
    emoji:  '¥',
    bg:     'bg-yellow-50',
    text:   'text-status-ready',
    border: 'border-status-ready/60',
  },
}

const TABLE_TYPE_LABELS: Record<string, string> = {
  counter: 'カウンター',
  table:   'テーブル',
  booth:   'ボックス',
}

// ============================================================
// TableCard: 席1枚
// ============================================================
function TableCard({ table }: { table: Table }) {
  const [pending, startTransition] = useTransition()
  const cfg = STATUS_CONFIG[table.status]

  // 次のステータスへの選択肢
  const transitions: { status: TableStatus; label: string }[] = table.status === 'empty'
    ? [{ status: 'occupied', label: '使用中にする' }]
    : table.status === 'occupied'
    ? [
        { status: 'billing', label: '会計待ちに' },
        { status: 'empty',   label: '空席に戻す' },
      ]
    : [{ status: 'empty', label: '片付け完了・空席に' }]

  const handleTransition = (newStatus: TableStatus) => {
    const confirmMsg = newStatus === 'empty'
      ? `席「${table.table_number}」を空席に戻します。\n注文は完了扱いになります。よろしいですか？`
      : `席「${table.table_number}」を「${STATUS_CONFIG[newStatus].label}」に変更します。`
    if (!window.confirm(confirmMsg)) return

    startTransition(async () => {
      if (newStatus === 'empty') {
        await clearTable(table.id)
      } else {
        await updateTableStatus({ tableId: table.id, status: newStatus })
      }
    })
  }

  return (
    <div className={cn(
      'rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all',
      cfg.bg, cfg.border
    )}>
      {/* 席番号 + ステータス */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-sans font-black text-4xl text-brand-dark leading-none">
            {table.table_number}
          </p>
          <p className="font-sans text-base text-gray-400 mt-0.5">
            {TABLE_TYPE_LABELS[table.table_type] ?? ''} · {table.capacity}名
          </p>
        </div>
        <div className={cn(
          'flex flex-col items-center justify-center h-14 w-14 rounded-xl border-2',
          cfg.bg, cfg.border
        )}>
          <span className={cn('font-sans font-black text-2xl leading-none', cfg.text)}>
            {cfg.emoji}
          </span>
          <span className={cn('font-sans font-bold text-[10px] leading-none mt-0.5', cfg.text)}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ステータス変更ボタン */}
      <div className="space-y-1.5">
        {transitions.map(t => (
          <button
            key={t.status}
            onClick={() => handleTransition(t.status)}
            disabled={pending}
            className={cn(
              'w-full h-12 rounded-xl font-sans font-bold text-base border-2 transition-all',
              'disabled:opacity-50',
              t.status === 'empty'
                ? 'border-status-delivered text-status-delivered bg-white hover:bg-green-50'
                : t.status === 'billing'
                ? 'border-status-ready text-amber-600 bg-white hover:bg-yellow-50'
                : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
            )}
          >
            {pending ? '...' : t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// S4 メインページ
// ============================================================
export default function StaffTablesPage() {
  const { tables, isLoading } = useTablesRealtime()

  const emptyCount    = tables.filter(t => t.status === 'empty').length
  const occupiedCount = tables.filter(t => t.status === 'occupied').length
  const billingCount  = tables.filter(t => t.status === 'billing').length

  return (
    <StaffLayout
      title="席状況"
      headerRight={
        <div className="flex gap-1.5 text-xs font-sans font-bold">
          <span className="bg-green-100 text-status-delivered px-2 py-1 rounded-full">空 {emptyCount}</span>
          <span className="bg-red-100 text-status-alert px-2 py-1 rounded-full">使 {occupiedCount}</span>
          {billingCount > 0 && (
            <span className="bg-yellow-100 text-amber-600 px-2 py-1 rounded-full">会 {billingCount}</span>
          )}
        </div>
      }
    >
      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🪑</p>
            <p className="font-sans font-bold text-brand-dark">席が登録されていません</p>
            <p className="font-sans text-sm text-gray-400 mt-1">管理画面 › 席管理から席を追加してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tables.map(table => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  )
}
