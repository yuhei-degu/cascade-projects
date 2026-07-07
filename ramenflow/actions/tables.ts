'use server'
// actions/tables.ts
// RamenFlow — 席管理アクション（owner 認証必須）

import { requireStaffAuth } from '@/lib/auth/staff'
import { generateAndStoreQR } from '@/lib/qr'
import type { ActionResult, TableFormInput } from '@/lib/types/database'

/**
 * 席の作成または更新
 * 新規作成時はQRコードも自動生成してStorageに保存
 */
export async function upsertTable(
  input: TableFormInput & { id?: string }
): Promise<ActionResult<{ id: string; qrCodePath: string }>> {
  const auth = await requireStaffAuth({ role: 'owner' })
  if (!auth.ok) return { error: auth.error }
  const { supabase } = auth

  try {
    if (input.id) {
      // 更新
      const { error } = await supabase
        .from('tables')
        .update({
          table_number: input.table_number,
          table_type: input.table_type,
          capacity: input.capacity,
        })
        .eq('id', input.id)

      if (error) return { error: '席の更新に失敗しました。' }

      // QRコードを再生成
      const qrCodePath = await generateAndStoreQR(input.id, input.table_number)
      await supabase
        .from('tables')
        .update({ qr_code_path: qrCodePath })
        .eq('id', input.id)

      return { success: true, data: { id: input.id, qrCodePath } }
    }

    // 新規作成
    const { data: newTable, error } = await supabase
      .from('tables')
      .insert({
        table_number: input.table_number,
        table_type: input.table_type,
        capacity: input.capacity,
        status: 'empty',
      })
      .select('id')
      .single()

    if (error || !newTable) {
      // table_number の UNIQUE 制約違反
      if (error?.code === '23505') {
        return { error: `席番号「${input.table_number}」はすでに使用されています。` }
      }
      return { error: '席の追加に失敗しました。' }
    }

    // QRコード生成
    const qrCodePath = await generateAndStoreQR(newTable.id, input.table_number)
    await supabase
      .from('tables')
      .update({ qr_code_path: qrCodePath })
      .eq('id', newTable.id)

    return { success: true, data: { id: newTable.id, qrCodePath } }
  } catch (e) {
    console.error('[upsertTable] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}

/**
 * 席の削除
 * アクティブな注文が存在する場合は拒否
 */
export async function deleteTable(tableId: string): Promise<ActionResult> {
  const auth = await requireStaffAuth({ role: 'owner' })
  if (!auth.ok) return { error: auth.error }
  const { supabase } = auth

  try {
    // アクティブな注文確認
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .limit(1)

    if (activeOrders && activeOrders.length > 0) {
      return { error: 'この席には未完了の注文があるため削除できません。' }
    }

    // Storage から QRコード削除
    await supabase.storage
      .from('qr-codes')
      .remove([`qr-codes/${tableId}.png`])

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId)

    if (error) return { error: '席の削除に失敗しました。' }
    return { success: true }
  } catch (e) {
    console.error('[deleteTable] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}
