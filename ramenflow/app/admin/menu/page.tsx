// app/admin/menu/page.tsx
// A2: メニュー管理画面

import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { MenuManagerClient } from '@/components/admin/MenuManagerClient'
import type { MenuCategoryWithItems } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminMenuPage() {
  const supabase = await createClient()

  const [categoriesRes, itemsRes] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('menu_items')
      .select(`
        *,
        option_groups:menu_option_groups(
          *,
          options:menu_options(*)
        )
      `)
      .order('display_order', { ascending: true }),
  ])

  // カテゴリごとにアイテムをグループ化
  const categories = (categoriesRes.data ?? []) as MenuCategoryWithItems[]
  const items = itemsRes.data ?? []

  const categoriesWithItems: MenuCategoryWithItems[] = categories.map(cat => ({
    ...cat,
    items: (items.filter(item => item.category_id === cat.id) as MenuCategoryWithItems['items']),
  }))

  // カテゴリなしのアイテム
  const uncategorizedItems = items.filter(item => !item.category_id)

  return (
    <AdminLayout title="メニュー管理">
      <MenuManagerClient
        initialCategories={categoriesWithItems}
        uncategorizedItems={uncategorizedItems as MenuCategoryWithItems['items']}
        allCategories={categoriesRes.data ?? []}
      />
    </AdminLayout>
  )
}
