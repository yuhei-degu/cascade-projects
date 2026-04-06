'use client'
// hooks/useCart.ts
// RamenFlow — カート状態管理（useReducer）
// C2（メニュー選択）→ C3（注文確認）でセッション内で保持

import { useReducer, useCallback } from 'react'
import type { CartState, CartAction, CartItem, SelectedOption } from '@/lib/types/database'

// カートアイテムの一意IDを生成（menuItemId + optionsの組み合わせ）
function generateCartItemId(
  menuItemId: string,
  selectedOptions: SelectedOption[]
): string {
  const optionKey = selectedOptions
    .map(o => `${o.group_id}:${o.option_id}`)
    .sort()
    .join('|')
  return `${menuItemId}__${optionKey}`
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const cartItemId = generateCartItemId(
        action.item.menuItemId,
        action.item.selectedOptions
      )
      const existingIndex = state.items.findIndex(i => i.cartItemId === cartItemId)

      if (existingIndex >= 0) {
        // 同じオプションの商品は数量を増やす
        const updatedItems = [...state.items]
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + 1,
        }
        return { ...state, items: updatedItems }
      }

      return {
        ...state,
        items: [...state.items, { ...action.item, cartItemId, quantity: 1 }],
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.cartItemId !== action.cartItemId),
      }

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(i => i.cartItemId !== action.cartItemId),
        }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.cartItemId === action.cartItemId
            ? { ...i, quantity: action.quantity }
            : i
        ),
      }
    }

    case 'CLEAR':
      return { ...state, items: [] }

    default:
      return state
  }
}

export function useCart(tableId: string, tableNumber: string) {
  const [cart, dispatch] = useReducer(cartReducer, {
    tableId,
    tableNumber,
    items: [],
  })

  const addItem = useCallback((
    menuItemId: string,
    menuItemName: string,
    unitPrice: number,
    selectedOptions: SelectedOption[],
    notes?: string
  ) => {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        cartItemId: '', // generateCartItemId で自動生成
        menuItemId,
        menuItemName,
        unitPrice,
        quantity: 1,
        selectedOptions,
        notes,
      },
    })
  }, [])

  const removeItem = useCallback((cartItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', cartItemId })
  }, [])

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', cartItemId, quantity })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  // 合計金額
  const totalAmount = cart.items.reduce((sum, item) => {
    const optionsDelta = item.selectedOptions.reduce(
      (s, o) => s + o.price_delta, 0
    )
    return sum + (item.unitPrice + optionsDelta) * item.quantity
  }, 0)

  // 合計点数
  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart,
    totalAmount,
    totalCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }
}

// ---- 価格フォーマットユーティリティ ----
export function formatPrice(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

// ---- CartItemをsubmitOrder用に変換 ----
export function cartItemsToOrderInput(items: CartItem[]) {
  return items.map(item => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    selectedOptions: item.selectedOptions,
    notes: item.notes,
  }))
}
