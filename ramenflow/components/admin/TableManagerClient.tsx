'use client'
// components/admin/TableManagerClient.tsx
// A3: 席一覧 + 追加/編集フォーム + QRコード表示
// クライアントコンポーネント（フォームの状態管理のため）

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertTable, deleteTable } from '@/actions/tables'
import { QRCodeDisplay } from '@/components/admin/QRCodeDisplay'
import { TableStatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Table, TableType } from '@/lib/types/database'

// ---- フォームスキーマ ----
const tableSchema = z.object({
  table_number: z
    .string()
    .min(1, '席番号を入力してください')
    .max(10)
    .regex(/^[A-Za-z0-9\-_]+$/, '席番号は英数字・ハイフン・アンダースコアのみ使用できます'),
  table_type: z.enum(['counter', 'table', 'booth'] as const),
  capacity: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int()
    .min(1)
    .max(20),
})
type TableFormValues = z.infer<typeof tableSchema>

const TABLE_TYPE_LABELS: Record<TableType, string> = {
  counter: 'カウンター',
  table:   'テーブル',
  booth:   'ボックス席',
}

const inputClass = cn(
  'w-full h-12 px-4 rounded-xl border-2 font-sans text-base text-brand-dark',
  'bg-white outline-none transition-colors',
  'border-gray-200 focus:border-brand-red placeholder:text-gray-300'
)

// ============================================================
// TableForm: 追加 / 編集フォーム
// ============================================================
function TableForm({
  table,
  onSuccess,
  onCancel,
}: {
  table?: Table
  onSuccess: (t: Table & { qrCodePath?: string }) => void
  onCancel: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!table

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      table_number: table?.table_number ?? '',
      table_type:   table?.table_type ?? 'counter',
      capacity:     table?.capacity ?? 2,
    },
  })

  const onSubmit = (data: TableFormValues) => {
    startTransition(async () => {
      setError(null)
      const result = await upsertTable({ ...data, id: table?.id })
      if ('error' in result) { setError(result.error); return }
      onSuccess({
        ...(table ?? {} as Table),
        ...data,
        id: result.data.id,
        qr_code_path: result.data.qrCodePath,
      })
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl p-5 border-2 border-brand-red/20 shadow-sm space-y-4"
    >
      <h3 className="font-sans font-bold text-brand-dark">
        {isEditing ? '席を編集' : '席を追加'}
      </h3>

      {/* 席番号 */}
      <div>
        <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">
          席番号 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('table_number')}
          placeholder="例: A1, B2, カウンター1"
          className={cn(inputClass, errors.table_number && 'border-red-400')}
        />
        {errors.table_number && (
          <p className="mt-1 text-xs font-sans text-red-600">{errors.table_number.message}</p>
        )}
      </div>

      {/* 席種別 */}
      <div>
        <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">
          席の種類
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['counter', 'table', 'booth'] as TableType[]).map((t) => (
            <label
              key={t}
              className="flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 cursor-pointer transition-colors has-[:checked]:border-brand-red has-[:checked]:bg-red-50 border-gray-200"
            >
              <input {...register('table_type')} type="radio" value={t} className="sr-only" />
              <span className="font-sans text-sm font-medium">{TABLE_TYPE_LABELS[t]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 収容人数 */}
      <div>
        <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">
          収容人数
        </label>
        <div className="flex items-center gap-3">
          <input
            {...register('capacity', { valueAsNumber: true })}
            type="number"
            min={1}
            max={20}
            className={cn(inputClass, 'w-20 text-center')}
          />
          <span className="font-sans text-sm text-gray-500">名</span>
        </div>
      </div>

      {error && (
        <p className="text-sm font-sans text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl font-sans font-semibold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-11 rounded-xl font-sans font-bold text-sm bg-brand-red text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? '保存中...' : isEditing ? '更新する' : 'QRを生成して追加'}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// TableCard: 席1件の表示カード
// ============================================================
function TableCard({
  table,
  onEdit,
  onDelete,
  onShowQR,
}: {
  table: Table
  onEdit: () => void
  onDelete: () => void
  onShowQR: () => void
}) {
  const [deleting, startDelete] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    if (!window.confirm(`席「${table.table_number}」を削除しますか？\nQRコードも削除されます。`)) return
    startDelete(async () => {
      setError(null)
      const result = await deleteTable(table.id)
      if ('error' in result) { setError(result.error) }
      // 成功時は親で再フェッチ
      else onDelete()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      {/* 席番号 */}
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center">
        <span className="font-sans font-bold text-sm text-brand-dark leading-none text-center">
          {table.table_number}
        </span>
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className="font-sans font-bold text-brand-dark">
          {TABLE_TYPE_LABELS[table.table_type]} · {table.capacity}名
        </p>
        <TableStatusBadge status={table.status} className="mt-1" />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      {/* アクション */}
      <div className="flex gap-2 flex-shrink-0">
        {table.qr_code_path && (
          <button
            onClick={onShowQR}
            className="h-10 w-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-red hover:text-brand-red transition-colors text-gray-400"
            title="QRコードを表示"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3M14 20h3"/>
            </svg>
          </button>
        )}
        <button
          onClick={onEdit}
          className="h-10 w-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors text-gray-400"
          title="編集"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-10 w-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors text-gray-400 disabled:opacity-50"
          title="削除"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ============================================================
// TableManagerClient: メインコンポーネント
// ============================================================
export function TableManagerClient({ initialTables }: { initialTables: Table[] }) {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [showForm, setShowForm]       = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [qrTable, setQrTable]         = useState<Table | null>(null)

  const handleFormSuccess = (updated: Table) => {
    setTables(prev => {
      const exists = prev.find(t => t.id === updated.id)
      if (exists) return prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)
      return [...prev, updated].sort((a, b) => a.table_number.localeCompare(b.table_number))
    })
    setShowForm(false)
    setEditingTable(null)
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-lg">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-gray-500">{tables.length}席登録済み</p>
        {!showForm && !editingTable && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-red text-white font-sans font-bold text-sm hover:bg-red-700 transition-colors"
          >
            <span>+</span> 席を追加
          </button>
        )}
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <TableForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 編集フォーム */}
      {editingTable && (
        <TableForm
          table={editingTable}
          onSuccess={handleFormSuccess}
          onCancel={() => setEditingTable(null)}
        />
      )}

      {/* 席一覧 */}
      {tables.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🪑</p>
          <p className="font-sans font-bold text-brand-dark">席が登録されていません</p>
          <p className="font-sans text-sm text-gray-400 mt-1">「席を追加」から最初の席を登録してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={() => { setEditingTable(table); setShowForm(false) }}
              onDelete={() => setTables(prev => prev.filter(t => t.id !== table.id))}
              onShowQR={() => setQrTable(table)}
            />
          ))}
        </div>
      )}

      {/* QRコードモーダル */}
      {qrTable && (
        <QRCodeDisplay
          table={qrTable}
          onClose={() => setQrTable(null)}
        />
      )}

      {/* 一括印刷ボタン */}
      {tables.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => window.print()}
            className="w-full h-12 rounded-xl font-sans font-bold text-sm border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-colors no-print"
          >
            🖨️ QRコードを一括印刷
          </button>
          <p className="text-xs font-sans text-gray-400 text-center mt-2">
            印刷ダイアログが開きます
          </p>
        </div>
      )}
    </div>
  )
}
