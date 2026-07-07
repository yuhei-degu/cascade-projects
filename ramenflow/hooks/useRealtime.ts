'use client'
// hooks/useOrdersRealtime.ts
// RamenFlow — スタッフ注文管理画面用 Realtime フック

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOrderStatusForTable } from '@/actions/order'
import type { OrderWithItems } from '@/lib/types/database'

/**
 * アクティブな全注文をリアルタイムで購読するフック
 * S2（注文管理ダッシュボード）と S3（厨房ビュー）で使用
 */
export function useOrdersRealtime() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        table_id,
        status,
        total_amount,
        created_at,
        updated_at,
        table:tables(id, table_number),
        order_items(
          id,
          order_id,
          menu_item_id,
          quantity,
          unit_price,
          status,
          selected_options,
          notes,
          created_at,
          updated_at,
          menu_item:menu_items(id, name, cooking_time_minutes, image_url)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError('注文データの取得に失敗しました。')
      return
    }

    setOrders((data as unknown as OrderWithItems[]) ?? [])
    setError(null)
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchOrders().finally(() => setIsLoading(false))

    const supabase = createClient()

    // orders と order_items 両方を購読
    const channel = supabase
      .channel('staff-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { fetchOrders() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => { fetchOrders() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  return { orders, isLoading, error, refetch: fetchOrders }
}

// ============================================================
// hooks/useTablesRealtime.ts
// ============================================================

/**
 * 全席状態をリアルタイムで購読するフック
 * S4（席状況一覧）で使用
 */
export function useTablesRealtime() {
  const [tables, setTables] = useState<import('@/lib/types/database').Table[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTables = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true })
    setTables(data ?? [])
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchTables().finally(() => setIsLoading(false))

    const supabase = createClient()
    const channel = supabase
      .channel('tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        () => { fetchTables() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTables])

  return { tables, isLoading, refetch: fetchTables }
}

// ============================================================
// hooks/useStoreSettingsRealtime.ts
// ============================================================

/**
 * 店舗設定（待ち時間・営業状態）をリアルタイムで購読するフック
 * H1（ホームページトップ）で使用
 */
export function useStoreSettingsRealtime() {
  const [settings, setSettings] = useState<import('@/lib/types/database').StoreSettings | null>(null)

  const fetchSettings = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .single()
    setSettings(data)
  }, [])

  useEffect(() => {
    fetchSettings()

    const supabase = createClient()
    const channel = supabase
      .channel('store-settings-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_settings' },
        () => { fetchSettings() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchSettings])

  return { settings, refetch: fetchSettings }
}

// ============================================================
// hooks/useOrderStatus.ts
// ============================================================

/**
 * 特定の注文のステータスを追跡するフック
 * C4（注文完了・状況）で使用
 */
export function useOrderStatus(orderId: string, tableId: string) {
  const [orderItems, setOrderItems] = useState<
    import('@/lib/types/database').OrderItemWithMenu[]
  >([])
  const [tableNumber, setTableNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrderItems = useCallback(async () => {
    if (!orderId || !tableId) {
      setOrderItems([])
      setTableNumber('')
      setError(null)
      return
    }

    const result = await getOrderStatusForTable({ orderId, tableId })
    if ('error' in result) {
      setOrderItems([])
      setTableNumber('')
      setError(result.error)
      return
    }

    setOrderItems(result.data.orderItems)
    setTableNumber(result.data.tableNumber)
    setError(null)
  }, [orderId, tableId])

  useEffect(() => {
    setIsLoading(true)
    fetchOrderItems().finally(() => setIsLoading(false))

    const supabase = createClient()
    const channel = supabase
      .channel(`order-${orderId}-realtime`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        () => { fetchOrderItems() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId, tableId, fetchOrderItems])

  return { orderItems, tableNumber, isLoading, error }
}
