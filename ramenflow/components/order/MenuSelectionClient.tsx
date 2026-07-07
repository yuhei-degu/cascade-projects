'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, formatPrice } from '@/hooks/useCart'
import { SoldOutBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type {
  MenuCategory,
  MenuItemWithOptions,
  SelectedOption,
} from '@/lib/types/database'

function OptionModal({
  item,
  onAdd,
  onClose,
}: {
  item: MenuItemWithOptions
  onAdd: (opts: SelectedOption[]) => void
  onClose: () => void
}) {
  const hasGroups = item.option_groups && item.option_groups.length > 0
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    item.option_groups?.forEach(group => {
      if (group.is_required && group.options.length > 0) {
        init[group.id] = group.options[0].id
      }
    })
    return init
  })

  const handleSelect = (groupId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [groupId]: optionId }))
  }

  const canAdd = item.option_groups?.every(group =>
    !group.is_required || selections[group.id]
  ) ?? true

  const handleAdd = () => {
    const selectedOptions: SelectedOption[] = []
    item.option_groups?.forEach(group => {
      const optionId = selections[group.id]
      if (!optionId) return
      const option = group.options.find(opt => opt.id === optionId)
      if (!option) return
      selectedOptions.push({
        group_id: group.id,
        group_name: group.name,
        option_id: option.id,
        option_name: option.name,
        price_delta: option.price_delta,
      })
    })
    onAdd(selectedOptions)
    onClose()
  }

  const optionTotal = Object.values(selections).reduce((sum, optionId) => {
    for (const group of item.option_groups ?? []) {
      const option = group.options.find(opt => opt.id === optionId)
      if (option) return sum + option.price_delta
    }
    return sum
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[430px] mx-auto bg-white rounded-t-3xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-sans font-bold text-lg text-brand-dark">{item.name}</h3>
              <p className="font-sans font-semibold text-brand-red mt-0.5">
                {formatPrice(item.price + optionTotal)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 px-3 rounded-full bg-gray-100 flex items-center justify-center text-xs font-sans font-bold text-gray-500 hover:bg-gray-200 flex-shrink-0"
            >
              閉じる
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-5 space-y-6">
          {!hasGroups ? (
            <p className="font-sans text-sm text-gray-400 text-center py-4">
              選べるオプションはありません
            </p>
          ) : (
            item.option_groups?.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-sans font-bold text-sm text-brand-dark">{group.name}</h4>
                  {group.is_required && (
                    <span className="text-xs font-sans bg-brand-red text-white px-2 py-0.5 rounded-full">必須</span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.options.map(option => {
                    const isSelected = selections[group.id] === option.id
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelect(group.id, option.id)}
                        className={cn(
                          'w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left',
                          isSelected
                            ? 'border-brand-red bg-red-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        <span className={cn(
                          'font-sans font-medium text-base',
                          isSelected ? 'text-brand-red' : 'text-brand-dark'
                        )}>
                          {option.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {option.price_delta !== 0 && (
                            <span className="font-sans text-sm text-gray-500">
                              {option.price_delta > 0 ? `+${formatPrice(option.price_delta)}` : formatPrice(option.price_delta)}
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-xs font-sans font-bold text-brand-red">選択中</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bottom-safe-area">
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={cn(
              'w-full h-14 rounded-2xl font-sans font-black text-lg text-white transition-all',
              canAdd
                ? 'bg-brand-red hover:bg-red-700 shadow-lg shadow-brand-red/20'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            カートに追加する
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuItemCard({
  item,
  onSelect,
}: {
  item: MenuItemWithOptions
  onSelect: () => void
}) {
  const isSoldOut = item.is_sold_out
  const hasOptions = item.option_groups && item.option_groups.length > 0

  return (
    <button
      onClick={isSoldOut ? undefined : onSelect}
      disabled={isSoldOut}
      className={cn(
        'w-full text-left flex items-center gap-3 p-3 rounded-2xl border transition-all',
        isSoldOut
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
          : 'bg-white border-gray-100 hover:border-brand-red/30 hover:shadow-sm active:scale-[0.99]'
      )}
    >
      <div className="h-16 w-16 rounded-xl bg-brand-cream flex-shrink-0 overflow-hidden">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn(
            'font-sans font-bold text-base text-brand-dark',
            isSoldOut && 'line-through text-gray-400'
          )}>
            {item.name}
          </p>
          {isSoldOut && <SoldOutBadge />}
          {hasOptions && !isSoldOut && (
            <span className="text-xs font-sans text-gray-400">カスタム可</span>
          )}
        </div>
        {item.description && (
          <p className="font-sans text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <p className="font-sans font-black text-brand-red text-base mt-1">
          {formatPrice(item.price)}
        </p>
      </div>

      {!isSoldOut && (
        <div className="h-9 w-9 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-xl leading-none">+</span>
        </div>
      )}
    </button>
  )
}

export function MenuSelectionClient({
  categories,
  items,
}: {
  categories: MenuCategory[]
  items: MenuItemWithOptions[]
}) {
  const router = useRouter()
  const [tableId, setTableId] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [activeCatId, setActiveCatId] = useState<string | null>(
    categories[0]?.id ?? null
  )
  const [modalItem, setModalItem] = useState<MenuItemWithOptions | null>(null)

  useEffect(() => {
    const id = sessionStorage.getItem('rf_table_id') ?? ''
    const num = sessionStorage.getItem('rf_table_number') ?? ''
    if (!id) {
      router.replace('/')
      return
    }
    setTableId(id)
    setTableNumber(num)
  }, [router])

  const { cart, totalAmount, totalCount, addItem } = useCart(tableId, tableNumber)

  useEffect(() => {
    sessionStorage.setItem('rf_cart', JSON.stringify(cart))
  }, [cart])

  const handleAddItem = (item: MenuItemWithOptions, opts: SelectedOption[]) => {
    addItem(item.id, item.name, item.price, opts)
  }

  const displayedItems = activeCatId
    ? items.filter(item => item.category_id === activeCatId)
    : items

  const tabs = [{ id: null, name: 'すべて' }, ...categories] as { id: string | null; name: string }[]

  return (
    <div className="flex flex-col h-full relative">
      <div className="sticky top-0 z-10 bg-brand-cream border-b border-brand-dark/10">
        <div className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id ?? 'all'}
              onClick={() => setActiveCatId(tab.id)}
              className={cn(
                'flex-shrink-0 h-9 px-4 rounded-full font-sans font-semibold text-sm transition-all',
                activeCatId === tab.id
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white text-brand-dark/60 border border-gray-200 hover:border-gray-300'
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-2">
        {displayedItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">🍜</p>
            <p className="font-sans text-sm text-gray-400">このカテゴリには表示できる商品がありません</p>
          </div>
        ) : (
          displayedItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onSelect={() => {
                if (item.option_groups && item.option_groups.length > 0) {
                  setModalItem(item)
                } else {
                  handleAddItem(item, [])
                }
              }}
            />
          ))
        )}
      </div>

      {totalCount > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-gradient-to-t from-brand-cream via-brand-cream to-transparent pt-8 bottom-safe-area">
          <button
            onClick={() => router.push('/order/confirm')}
            className={cn(
              'w-full h-16 rounded-2xl font-sans font-black text-lg text-white',
              'bg-brand-dark hover:bg-black active:bg-gray-900',
              'flex items-center justify-between px-5',
              'shadow-xl shadow-brand-dark/20 transition-all'
            )}
          >
            <span className="bg-white/20 rounded-full h-8 w-8 flex items-center justify-center text-sm font-black">
              {totalCount}
            </span>
            <span>注文内容を確認する</span>
            <span>{formatPrice(totalAmount)}</span>
          </button>
        </div>
      )}

      {modalItem && (
        <OptionModal
          item={modalItem}
          onAdd={(opts) => handleAddItem(modalItem, opts)}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  )
}
