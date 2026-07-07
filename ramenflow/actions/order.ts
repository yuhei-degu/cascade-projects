'use server'

import { requireStaffAuth } from '@/lib/auth/staff'
import { createClient } from '@/lib/supabase/server'
import { calcWaitMinutes } from '@/lib/wait-time'
import type {
  ActionResult,
  OrderItemStatus,
  OrderItemWithMenu,
  SubmitOrderInput,
} from '@/lib/types/database'

type PendingOrderItem = {
  status: 'new' | 'cooking'
  menu_item: { cooking_time_minutes: number } | { cooking_time_minutes: number }[] | null
}

type OrderWithTable = {
  id: string
  table_id: string
  table: { id: string; table_number: string } | { id: string; table_number: string }[] | null
}

const INVALID_TABLE_SESSION_ERROR =
  '席情報を確認できませんでした。QRコードを読み取り直して、もう一度お試しください。'

const INVALID_ORDER_SESSION_ERROR =
  'この注文は現在の席情報と一致しません。QRコードを読み取り直して、もう一度お試しください。'

async function getTableForOrdering(tableId: string) {
  if (!tableId) return null

  const supabase = await createClient()
  const { data: table, error } = await supabase
    .from('tables')
    .select('id, table_number, status')
    .eq('id', tableId)
    .single()

  if (error || !table) return null
  return table
}

async function getOrderForTable(orderId: string, tableId: string) {
  if (!orderId || !tableId) return null

  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, table_id, table:tables(id, table_number)')
    .eq('id', orderId)
    .eq('table_id', tableId)
    .single()

  if (error || !order) return null
  return order as unknown as OrderWithTable
}

function getJoinedTableNumber(order: OrderWithTable) {
  const table = Array.isArray(order.table) ? order.table[0] : order.table
  return table?.table_number ?? ''
}

export async function prepareOrderConfirmation(input: {
  tableId: string
}): Promise<ActionResult<{ tableNumber: string }>> {
  const table = await getTableForOrdering(input.tableId)
  if (!table) return { error: INVALID_TABLE_SESSION_ERROR }

  return { success: true, data: { tableNumber: table.table_number } }
}

export async function verifyOrderTableSession(input: {
  orderId: string
  tableId: string
}): Promise<ActionResult<{ tableNumber: string }>> {
  const order = await getOrderForTable(input.orderId, input.tableId)
  if (!order) return { error: INVALID_ORDER_SESSION_ERROR }

  return { success: true, data: { tableNumber: getJoinedTableNumber(order) } }
}

export async function getOrderStatusForTable(input: {
  orderId: string
  tableId: string
}): Promise<ActionResult<{ tableNumber: string; orderItems: OrderItemWithMenu[] }>> {
  const verified = await verifyOrderTableSession(input)
  if ('error' in verified) return verified

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_item:menu_items(id, name, cooking_time_minutes, image_url)
    `)
    .eq('order_id', input.orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getOrderStatusForTable] order_items fetch error:', error)
    return { error: '注文状況を取得できませんでした。時間をおいてもう一度お試しください。' }
  }

  return {
    success: true,
    data: {
      tableNumber: verified.data.tableNumber,
      orderItems: (data as unknown as OrderItemWithMenu[]) ?? [],
    },
  }
}

export async function submitOrder(
  input: SubmitOrderInput
): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient()

  try {
    const table = await getTableForOrdering(input.tableId)
    if (!table) return { error: INVALID_TABLE_SESSION_ERROR }

    if (input.items.length === 0) {
      return { error: '注文内容を確認できませんでした。メニューから選び直してください。' }
    }

    const totalAmount = input.items.reduce((sum, item) => {
      const optionsDelta = item.selectedOptions.reduce(
        (s, o) => s + o.price_delta,
        0
      )
      return sum + (item.unitPrice + optionsDelta) * item.quantity
    }, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: table.id,
        status: 'active',
        total_amount: totalAmount,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[submitOrder] order insert error:', orderError)
      return { error: '注文の送信に失敗しました。もう一度お試しください。' }
    }

    const verifiedOrder = await getOrderForTable(order.id, table.id)
    if (!verifiedOrder) {
      await supabase.from('orders').delete().eq('id', order.id)
      return { error: INVALID_ORDER_SESSION_ERROR }
    }

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
      await supabase.from('orders').delete().eq('id', order.id)
      return { error: '注文の送信に失敗しました。もう一度お試しください。' }
    }

    await supabase
      .from('tables')
      .update({ status: 'occupied' })
      .eq('id', table.id)

    await recalculateWaitTimeInternal()

    return { success: true, data: { orderId: order.id } }
  } catch (e) {
    console.error('[submitOrder] unexpected error:', e)
    return { error: 'サーバーエラーが発生しました。もう一度お試しください。' }
  }
}

async function recalculateWaitTimeInternal(): Promise<void> {
  const supabase = await createClient()

  try {
    const { data: pendingItems } = await supabase
      .from('order_items')
      .select(`
        status,
        menu_item:menu_items(cooking_time_minutes)
      `)
      .in('status', ['new', 'cooking'])

    const { data: settings } = await supabase
      .from('store_settings')
      .select('staff_count, parallel_cooking_capacity, is_open')
      .single()

    if (!settings || !settings.is_open) return

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

    await supabase
      .from('store_settings')
      .update({ estimated_wait_minutes: minutes })
      .eq('id', '00000000-0000-0000-0000-000000000001')
  } catch (e) {
    console.error('[recalculateWaitTime] error:', e)
  }
}

export async function recalculateWaitTime(): Promise<ActionResult> {
  const auth = await requireStaffAuth()
  if (!auth.ok) return { error: auth.error }

  await recalculateWaitTimeInternal()
  return { success: true }
}
