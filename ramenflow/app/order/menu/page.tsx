// app/order/menu/page.tsx
// C2: メニュー選択画面
// カテゴリタブ + 商品カード + 下部固定カートバー

import { createClient } from '@/lib/supabase/server'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { MenuSelectionClient } from '@/components/order/MenuSelectionClient'
import type { MenuItemWithOptions } from '@/lib/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'メニュー選択' }

export default async function OrderMenuPage() {
  const supabase = await createClient()

  // カテゴリ + メニュー + オプションを一括取得
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      *,
      option_groups:menu_option_groups(
        *,
        options:menu_options(* )
      )
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return (
    <CustomerLayout title="メニュー">
      <MenuSelectionClient
        categories={categories ?? []}
        items={(items ?? []) as MenuItemWithOptions[]}
      />
    </CustomerLayout>
  )
}
