'use server'
// actions/order.ts
// RamenFlow — 客向け注文送信アクション（認証不要）

import { createClient } from '@/lib/supabase/server'
import { calcWaitMinutes } from '@/lib/wait-time'
import type {
  ActionResult,
  OrderItemStatus,
  SubmitOrderInput,
} from '@/lib/types/database'

type PendingOrderItem = {
  status: 'new' | 'cooking'
  menu_item: { cooking_time_minutes: number } | { cooking_time_minutes: number }[] | null
}

/**
 * 注文を送信する（C3 注文確認画面から呼ばれる）
 * - orders + order_items を挿入
 * - tables.status を 'occupied' に更新
 * - 待ち時間を再計算
 */
export async function submitOrder(
  input: SubmitOrderInput
): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient()

  try {
    // 1. テーブルの存在確認
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, status')
      .eq('id', input.tableId)
      .single()

    if (tableError || !table) {
      return { error: '席情報が見つかりません。QRコードを読み取り直してください。' }
    }

    // 2. 合計金額を計算
    const totalAmount = input.items.reduce((sum, item) => {
      const optionsDelta = item.selectedOptions.reduce(
        (s, o) => s + o.price_delta, 0
      )
      return sum + (item.unitPrice + optionsDelta) * item.quantity
    }, 0)

    // 3. order を挿入
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: input.tableId,
        status: 'active',
        total_amount: totalAmount,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[submitOrder] order insert error:', orderError)
      return { error: '注文の送信に失敗しました。もう一度お試しください。' }
    }

    // 4. order_items を一括挿入
    const orderItemsPayload = input.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      status: 'new' as OrderItemStatus,
      selected_options: item.selectedOptions,
      notes: item.notes ?? null,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload)

    if (itemsError) {
      console.error('[submitOrder] order_items insert error:', itemsError)
      // ロールバック: orders を削除
      await supabase.from('orders').delete().eq('id', order.id)
      return { error: '注文の送信に失敗しました。もう一度お試しください。' }
    }

    // 5. 席を使用中に更新（すでに occupied でも問題なし）
    await supabase
      .from('tables')
      .update({ status: 'occupied' })
      .eq('id', input.tableId)

    // 6. 待ち時間を再計算
    await recalculateWaitTime()

    return { success: true, data: { orderId: order.id } }
  } catch (e) {
    console.error('[submitOrder] unexpected error:', e)
    return { error: 'サーバーエラーが発生しました。もう一度お試しください。' }
  }
}

/**
 * 待ち時間を再計算して store_settings を更新
 * 注文送信・ステータス変化のたびに呼ぶ
 */
export async function recalculateWaitTime(): Promise<void> {
  const supabase = await createClient()

  try {
    // 1. 未完了の注文アイテムを取得
    const { data: pendingItems } = await supabase
      .from('order_items')
      .select(`
        status,
        menu_item:menu_items(cooking_time_minutes)
      `)
      .in('status', ['new', 'cooking'])

    // 2. store_settings を取得
    const { data: settings } = await supabase
      .from('store_settings')
      .select('staff_count, parallel_cooking_capacity, is_open')
      .single()

    if (!settings || !settings.is_open) return

    // 3. 計算
    const items = ((pendingItems ?? []) as unknown as PendingOrderItem[]).map((i) => {
      const menuItem = Array.isArray(i.menu_item) ? i.menu_item[0] : i.menu_item

      return {
        status: i.status,
        cooking_time_minutes: menuItem?.cooking_time_minutes ?? 5,
      }
    })

    const minutes = calcWaitMinutes({
      pendingItems: items,
      staffCount: settings.staff_count,
      parallelCapacity: settings.parallel_cooking_capacity,
    })

    // 4. store_settings を更新
    await supabase
      .from('store_settings')
      .update({ estimated_wait_minutes: minutes })
      .eq('id', '00000000-0000-0000-0000-000000000001')
  } catch (e) {
    console.error('[recalculateWaitTime] error:', e)
    // 待ち時間計算失敗は注文フローをブロックしない
  }
}
