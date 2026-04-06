'use server'
// actions/settings.ts
// RamenFlow — 店舗設定アクション（owner 認証必須）

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, StoreStatus, StoreSettingsFormInput } from '@/lib/types/database'

const STORE_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

/**
 * 営業状態を切り替える
 * is_open も連動して更新する
 */
export async function updateStoreStatus(
  status: StoreStatus
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('store_settings')
    .update({
      status,
      is_open: status === 'open',
    })
    .eq('id', STORE_SETTINGS_ID)

  if (error) {
    console.error('[updateStoreStatus]', error)
    return { error: '営業状態の更新に失敗しました。' }
  }
  return { success: true }
}

/**
 * 店舗基本設定を保存する
 */
export async function updateStoreSettings(
  input: StoreSettingsFormInput
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('store_settings')
    .update({
      store_name: input.store_name,
      description: input.description ?? null,
      staff_count: input.staff_count,
      parallel_cooking_capacity: input.parallel_cooking_capacity,
    })
    .eq('id', STORE_SETTINGS_ID)

  if (error) {
    console.error('[updateStoreSettings]', error)
    return { error: '設定の保存に失敗しました。' }
  }
  return { success: true }
}

/**
 * 現在の店舗設定を取得する（Server Component用）
 */
export async function getStoreSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_settings')
    .select('*')
    .single()
  return data
}
