'use server'
// actions/menu.ts
// RamenFlow — メニュー管理アクション（owner 認証必須）

import { createClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  MenuItemFormInput,
} from '@/lib/types/database'

export async function upsertMenuItem(
  input: MenuItemFormInput & { id?: string }
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  try {
    const payload = {
      category_id: input.category_id ?? null,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      cooking_time_minutes: input.cooking_time_minutes,
      image_url: input.image_url ?? null,
      is_active: input.is_active,
      is_sold_out: input.is_sold_out,
      display_order: input.display_order ?? 0,
    }

    if (input.id) {
      // 更新
      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', input.id)
      if (error) return { error: 'メニューの更新に失敗しました。' }
      return { success: true, data: { id: input.id } }
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('menu_items')
        .insert(payload)
        .select('id')
        .single()
      if (error || !data) return { error: 'メニューの追加に失敗しました。' }
      return { success: true, data: { id: data.id } }
    }
  } catch (e) {
    console.error('[upsertMenuItem] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}

export async function toggleSoldOut(input: {
  menuItemId: string
  isSoldOut: boolean
}): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('menu_items')
    .update({ is_sold_out: input.isSoldOut })
    .eq('id', input.menuItemId)

  if (error) return { error: '売り切れ設定の更新に失敗しました。' }
  return { success: true }
}

export async function deleteMenuItem(menuItemId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // 注文履歴がある場合はソフト削除（is_active = false）
  const { data: relatedItems } = await supabase
    .from('order_items')
    .select('id')
    .eq('menu_item_id', menuItemId)
    .limit(1)

  if (relatedItems && relatedItems.length > 0) {
    // ソフト削除
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: false })
      .eq('id', menuItemId)
    if (error) return { error: 'メニューの削除に失敗しました。' }
    return { success: true }
  }

  // 注文履歴なし → 物理削除
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', menuItemId)
  if (error) return { error: 'メニューの削除に失敗しました。' }
  return { success: true }
}

export async function upsertMenuCategory(input: {
  id?: string
  name: string
  display_order?: number
  is_active?: boolean
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const payload = {
    name: input.name,
    display_order: input.display_order ?? 0,
    is_active: input.is_active ?? true,
  }

  if (input.id) {
    const { error } = await supabase
      .from('menu_categories')
      .update(payload)
      .eq('id', input.id)
    if (error) return { error: 'カテゴリの更新に失敗しました。' }
    return { success: true, data: { id: input.id } }
  }

  const { data, error } = await supabase
    .from('menu_categories')
    .insert(payload)
    .select('id')
    .single()
  if (error || !data) return { error: 'カテゴリの追加に失敗しました。' }
  return { success: true, data: { id: data.id } }
}

export async function saveOptionGroups(input: {
  menuItemId: string
  groups: {
    id?: string
    name: string
    isRequired: boolean
    options: { id?: string; name: string; priceDelta: number }[]
  }[]
}): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    // 既存のオプショングループを削除して再作成（最もシンプルなアプローチ）
    await supabase
      .from('menu_option_groups')
      .delete()
      .eq('menu_item_id', input.menuItemId)

    for (let gi = 0; gi < input.groups.length; gi++) {
      const group = input.groups[gi]

      const { data: newGroup, error: groupError } = await supabase
        .from('menu_option_groups')
        .insert({
          menu_item_id: input.menuItemId,
          name: group.name,
          is_required: group.isRequired,
          display_order: gi,
        })
        .select('id')
        .single()

      if (groupError || !newGroup) {
        return { error: 'オプションの保存に失敗しました。' }
      }

      const optionPayloads = group.options.map((opt, oi) => ({
        group_id: newGroup.id,
        name: opt.name,
        price_delta: opt.priceDelta,
        display_order: oi,
      }))

      if (optionPayloads.length > 0) {
        const { error: optError } = await supabase
          .from('menu_options')
          .insert(optionPayloads)
        if (optError) return { error: 'オプションの保存に失敗しました。' }
      }
    }

    return { success: true }
  } catch (e) {
    console.error('[saveOptionGroups] error:', e)
    return { error: 'サーバーエラーが発生しました。' }
  }
}
