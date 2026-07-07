'use server'
// actions/staff.ts
// RamenFlow — スタッフ向けアクション（staff / owner 認証必須）

import { createClient } from '@/lib/supabase/server'
import { requireStaffAuth } from '@/lib/auth/staff'
import { recalculateWaitTime } from '@/actions/order'
import type {
  ActionResult,
  OrderItemStatus,
  TableStatus,
} from '@/lib/types/database'

/**
 * 注文アイテムのステータスを変更する
 * new→cooking→ready→delivered の順のみ許可
 */
export async function updateOrderItemStatus(input: {
  orderItemId: string
  status: OrderItemStatus
}): Promise<ActionResult> {
  const auth = await requireStaffAuth()
  if (!auth.ok) return { error: auth.error }
  const { supabase } = auth

  try {
    // 現在のステータスを確認して不正な遷移を防ぐ
    const { data: current, error: fetchError } = await supabase
      .from('order_items')
      .select('id, status, order_id')
      .eq('id', input.orderItemId)
      .single()

    if (fetchError || !current) {
      return { error: '注文アイテムが見つかりません。' }
    }

    const VALID_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
      new:       ['cooking'],
      cooking:   ['ready', 'new'],    // 戻しも許可（誤操作時）
      ready:     ['delivered', 'cooking'],
      delivered: ['ready'],           // 誤提供済みの取り消し
    }

    const validNext = VALID_TRANSITIONS[current.status as OrderItemStatus] ?? []
    if (!validNext.includes(input.status)) {
      return {
        error: `ステータスを「${current.status}」から「${input.status}」に変更できません。`,
      }
    }

    const { error: updateError } = await supabase
      .from('order_items')
      .update({ status: input.status })
      .eq('id', input.orderItemId)

    if (updateError) {
      console.error('[updateOrderItemStatus] error:', updateError)
      return { error: 'ステータスの更新に失敗しました。' }
    }

    // deliveredになった場合、order全体が完了しているか確認
    if (input.status === 'delivered') {
      await checkAndCompleteOrder(current.order_id)
    }

    // 待ち時間を再計算
    await recalculateWaitTime()

    return { success: true }
  } catch (e) {
    console.error('[updateOrderItemStatus] unexpected error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}

/**
 * 注文の全アイテムが delivered になった場合、order.status を completed に更新
 */
async function checkAndCompleteOrder(orderId: string): Promise<void> {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('status')
    .eq('order_id', orderId)

  if (!items || items.length === 0) return

  const allDelivered = items.every(i => i.status === 'delivered')
  if (allDelivered) {
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)
  }
}

/**
 * 注文全体をキャンセルする
 */
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const auth = await requireStaffAuth()
  if (!auth.ok) return { error: auth.error }
  const { supabase } = auth

  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('status', 'active') // active のみキャンセル可

    if (error) {
      return { error: 'キャンセルに失敗しました。' }
    }

    await recalculateWaitTime()
    return { success: true }
  } catch (e) {
    console.error('[cancelOrder] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}

/**
 * 席を空席に戻す（清算完了時）
 * - 全アクティブ注文を completed に
 * - 席ステータスを empty に
 */
export async function clearTable(tableId: string): Promise<ActionResult> {
  const auth = await requireStaffAuth()
  if (!auth.ok) return { error: auth.error }
  const { supabase } = auth

  try {
    // アクティブな注文を全て completed に
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('table_id', tableId)
      .eq('status', 'active')

    // 席を空席に
    const { error } = await supabase
      .from('tables')
      .update({ status: 'empty' })
      .eq('id', tableId)

    if (error) {
      return { error: '席の更新に失敗しました。' }
    }

    await recalculateWaitTime()
    return { success: true }
  } catch (e) {
    console.error('[clearTable] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}

/**
 * 席ステータスを手動変更（billing 等）
 */
export async function updateTableStatus(input: {
  tableId: string
  status: TableStatus
}): Promise<ActionResult> {
  const auth = await requireStaffAuth()
  if (!auth.ok) return { error: auth.error }
  const { supabase } = auth

  try {
    const { error } = await supabase
      .from('tables')
      .update({ status: input.status })
      .eq('id', input.tableId)

    if (error) {
      return { error: '席ステータスの更新に失敗しました。' }
    }

    return { success: true }
  } catch (e) {
    console.error('[updateTableStatus] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}
