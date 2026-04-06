'use client'
// components/admin/MenuManagerClient.tsx
// A2: メニュー一覧 + 追加/編集フォーム + 売り切れトグル

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertMenuItem, toggleSoldOut, deleteMenuItem, upsertMenuCategory } from '@/actions/menu'
import { SoldOutBadge } from '@/components/ui/Badge'
import { formatPrice, cn } from '@/lib/utils'
import type {
  MenuCategory,
  MenuCategoryWithItems,
  MenuItemWithOptions,
} from '@/lib/types/database'

// ---- バリデーション ----
const menuItemSchema = z.object({
  name:                 z.string().min(1, '商品名を入力してください').max(50),
  description:          z.string().max(200).optional(),
  price:                z.number({ invalid_type_error: '価格を入力してください' }).min(1, '1円以上で設定してください').max(100000),
  cooking_time_minutes: z.number({ invalid_type_error: '調理時間を入力してください' }).min(1).max(120),
  category_id:          z.string().optional(),
  is_active:            z.boolean(),
  is_sold_out:          z.boolean(),
})
type MenuItemFormValues = z.infer<typeof menuItemSchema>

const inputClass = cn(
  'w-full h-12 px-4 rounded-xl border-2 font-sans text-base text-brand-dark',
  'bg-white outline-none transition-colors',
  'border-gray-200 focus:border-brand-red placeholder:text-gray-300'
)

// ============================================================
// MenuItemForm
// ============================================================
function MenuItemForm({
  item,
  categories,
  onSuccess,
  onCancel,
}: {
  item?: MenuItemWithOptions
  categories: MenuCategory[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!item

  const { register, handleSubmit, formState: { errors } } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name:                 item?.name ?? '',
      description:          item?.description ?? '',
      price:                item?.price ?? 900,
      cooking_time_minutes: item?.cooking_time_minutes ?? 7,
      category_id:          item?.category_id ?? '',
      is_active:            item?.is_active ?? true,
      is_sold_out:          item?.is_sold_out ?? false,
    },
  })

  const onSubmit = (data: MenuItemFormValues) => {
    startTransition(async () => {
      setError(null)
      const result = await upsertMenuItem({
        ...data,
        category_id: data.category_id || undefined,
        id: item?.id,
      })
      if ('error' in result) { setError(result.error); return }
      onSuccess()
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border-2 border-brand-red/20 p-5 space-y-4 shadow-sm"
    >
      <h3 className="font-sans font-bold text-brand-dark">
        {isEditing ? `「${item.name}」を編集` : 'メニューを追加'}
      </h3>

      {/* 商品名 */}
      <div>
        <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">
          商品名 <span className="text-red-500">*</span>
        </label>
        <input {...register('name')} placeholder="例: 醤油ラーメン" className={cn(inputClass, errors.name && 'border-red-400')} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {/* 説明 */}
      <div>
        <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">説明（省略可）</label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="商品の説明・アレルギー情報など"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-red font-sans text-base text-brand-dark bg-white outline-none resize-none placeholder:text-gray-300"
        />
      </div>

      {/* 価格・調理時間 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">
            価格 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-gray-400">¥</span>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              min={1}
              className={cn(inputClass, 'pl-8', errors.price && 'border-red-400')}
            />
          </div>
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">調理時間</label>
          <div className="flex items-center gap-2">
            <input
              {...register('cooking_time_minutes', { valueAsNumber: true })}
              type="number"
              min={1}
              max={120}
              className={cn(inputClass, 'w-20 text-center')}
            />
            <span className="font-sans text-sm text-gray-500 whitespace-nowrap">分</span>
          </div>
        </div>
      </div>

      {/* カテゴリ */}
      {categories.length > 0 && (
        <div>
          <label className="block font-sans text-sm font-semibold text-brand-dark mb-1.5">カテゴリ</label>
          <select
            {...register('category_id')}
            className={cn(inputClass, 'cursor-pointer')}
          >
            <option value="">カテゴリなし</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* トグル: 公開・売り切れ */}
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input {...register('is_active')} type="checkbox" className="w-5 h-5 accent-brand-red" />
          <span className="font-sans text-sm font-medium text-brand-dark">メニューに表示する</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input {...register('is_sold_out')} type="checkbox" className="w-5 h-5 accent-brand-red" />
          <span className="font-sans text-sm font-medium text-brand-dark">売り切れ</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 h-11 rounded-xl font-sans font-semibold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50">
          キャンセル
        </button>
        <button type="submit" disabled={isPending} className="flex-1 h-11 rounded-xl font-sans font-bold text-sm bg-brand-red text-white hover:bg-red-700 disabled:opacity-50">
          {isPending ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// MenuItemRow: 1商品の行表示
// ============================================================
function MenuItemRow({
  item,
  onEdit,
  onToggleSoldOut,
  onDelete,
}: {
  item: MenuItemWithOptions
  onEdit: () => void
  onToggleSoldOut: (isSoldOut: boolean) => void
  onDelete: () => void
}) {
  const [toggling, startToggle] = useTransition()
  const [deleting, startDelete] = useTransition()

  const handleToggleSoldOut = () => {
    startToggle(async () => {
      await toggleSoldOut({ menuItemId: item.id, isSoldOut: !item.is_sold_out })
      onToggleSoldOut(!item.is_sold_out)
    })
  }

  const handleDelete = () => {
    if (!window.confirm(`「${item.name}」を削除しますか？`)) return
    startDelete(async () => {
      const result = await deleteMenuItem(item.id)
      if ('error' in result) alert(result.error)
      else onDelete()
    })
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all',
      item.is_sold_out ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100',
      !item.is_active && 'opacity-40'
    )}>
      {/* 商品情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('font-sans font-bold text-brand-dark text-sm', item.is_sold_out && 'line-through text-gray-400')}>
            {item.name}
          </p>
          {item.is_sold_out && <SoldOutBadge />}
          {!item.is_active && <span className="text-xs font-sans bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">非公開</span>}
        </div>
        <p className="font-sans text-brand-red font-semibold text-sm mt-0.5">
          {formatPrice(item.price)} · {item.cooking_time_minutes}分
        </p>
      </div>

      {/* アクション */}
      <div className="flex gap-1.5 flex-shrink-0">
        {/* 売り切れトグル */}
        <button
          onClick={handleToggleSoldOut}
          disabled={toggling}
          className={cn(
            'h-9 px-3 rounded-lg font-sans text-xs font-semibold border-2 transition-all disabled:opacity-50',
            item.is_sold_out
              ? 'border-status-delivered text-status-delivered hover:bg-green-50'
              : 'border-gray-200 text-gray-500 hover:border-orange-300 hover:text-brand-orange'
          )}
        >
          {item.is_sold_out ? '再入荷' : '売り切れ'}
        </button>
        {/* 編集 */}
        <button onClick={onEdit} className="h-9 w-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        {/* 削除 */}
        <button onClick={handleDelete} disabled={deleting} className="h-9 w-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ============================================================
// MenuManagerClient: メインコンポーネント
// ============================================================
export function MenuManagerClient({
  initialCategories,
  uncategorizedItems,
  allCategories,
}: {
  initialCategories: MenuCategoryWithItems[]
  uncategorizedItems: MenuItemWithOptions[]
  allCategories: MenuCategory[]
}) {
  const router = useRouter()
  const [showForm, setShowForm]           = useState(false)
  const [editingItem, setEditingItem]     = useState<MenuItemWithOptions | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, startAddCategory] = useTransition()

  const refresh = () => {
    setShowForm(false)
    setEditingItem(null)
    router.refresh()
  }

  const totalItems = initialCategories.reduce((s, c) => s + c.items.length, 0) + uncategorizedItems.length

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    startAddCategory(async () => {
      await upsertMenuCategory({ name: newCategoryName.trim() })
      setNewCategoryName('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-gray-500">{totalItems}品登録済み</p>
        {!showForm && !editingItem && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-red text-white font-sans font-bold text-sm hover:bg-red-700"
          >
            + メニューを追加
          </button>
        )}
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <MenuItemForm categories={allCategories} onSuccess={refresh} onCancel={() => setShowForm(false)} />
      )}
      {editingItem && (
        <MenuItemForm item={editingItem} categories={allCategories} onSuccess={refresh} onCancel={() => setEditingItem(null)} />
      )}

      {/* カテゴリ別メニュー一覧 */}
      {initialCategories.map(cat => (
        <section key={cat.id}>
          <h2 className="font-sans font-bold text-sm text-gray-500 mb-2 flex items-center gap-2">
            {cat.name}
            <span className="font-normal text-gray-400">({cat.items.length}品)</span>
          </h2>
          <div className="space-y-2">
            {cat.items.length === 0 ? (
              <p className="text-xs font-sans text-gray-400 pl-2">このカテゴリに商品がありません</p>
            ) : cat.items.map(item => (
              <MenuItemRow
                key={item.id}
                item={item}
                onEdit={() => { setEditingItem(item); setShowForm(false) }}
                onToggleSoldOut={() => router.refresh()}
                onDelete={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      ))}

      {/* カテゴリなし */}
      {uncategorizedItems.length > 0 && (
        <section>
          <h2 className="font-sans font-bold text-sm text-gray-400 mb-2">カテゴリなし</h2>
          <div className="space-y-2">
            {uncategorizedItems.map(item => (
              <MenuItemRow
                key={item.id}
                item={item}
                onEdit={() => { setEditingItem(item); setShowForm(false) }}
                onToggleSoldOut={() => router.refresh()}
                onDelete={() => router.refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {/* カテゴリ追加 */}
      <section className="pt-4 border-t border-gray-100">
        <h3 className="font-sans font-bold text-sm text-gray-400 mb-2">カテゴリを追加</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="例: トッピング"
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 h-10 px-3 rounded-xl border-2 border-gray-200 focus:border-brand-red font-sans text-sm outline-none"
          />
          <button
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategoryName.trim()}
            className="h-10 px-4 rounded-xl bg-brand-red text-white font-sans font-bold text-sm hover:bg-red-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </section>
    </div>
  )
}
