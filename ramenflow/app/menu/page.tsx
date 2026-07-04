// app/menu/page.tsx
// H2: メニュー閲覧ページ（来店前の客向け・読み取り専用）

import { createClient } from '@/lib/supabase/server'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { SoldOutBadge } from '@/components/ui/Badge'
import { cn, formatPrice } from '@/lib/utils'
import type { MenuCategoryWithItems, MenuItemWithOptions } from '@/lib/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'メニュー',
  description: 'ラーメン店のメニュー一覧です。',
}

export const revalidate = 60 // 1分キャッシュ

export default async function MenuPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('menu_categories')
    .select(`
      *,
      items:menu_items(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return (
    <PublicLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif font-bold text-3xl text-brand-dark">メニュー</h1>
          <p className="font-sans text-sm text-brand-dark/50 mt-1">
            価格はすべて税込みです
          </p>
        </div>

        {((categories ?? []) as MenuCategoryWithItems[]).map(cat => {
          const activeItems = (cat.items ?? []).filter((item: MenuItemWithOptions) => item.is_active)
          if (activeItems.length === 0) return null

          return (
            <section key={cat.id}>
              {/* カテゴリ名 */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-serif font-bold text-xl text-brand-dark">{cat.name}</h2>
                <div className="flex-1 h-px bg-brand-dark/10" />
              </div>

              {/* 商品グリッド */}
              <div className="space-y-3">
                {activeItems.map((item: MenuItemWithOptions) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100',
                      item.is_sold_out && 'opacity-60'
                    )}
                  >
                    {/* 画像プレースホルダー */}
                    <div className="h-16 w-16 rounded-xl bg-brand-cream flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>
                      )}
                    </div>

                    {/* テキスト */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-sans font-bold text-brand-dark">{item.name}</p>
                        {item.is_sold_out && <SoldOutBadge />}
                      </div>
                      {item.description && (
                        <p className="font-sans text-xs text-gray-400 mt-0.5">{item.description}</p>
                      )}
                      <p className="font-sans font-black text-brand-red text-lg mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* QR注文への誘導 */}
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-5 text-center">
          <p className="font-serif font-bold text-brand-dark text-lg mb-1">ご来店後は</p>
          <p className="font-sans text-sm text-brand-dark/60">
            テーブルのQRコードを読み取って<br />スマートフォンからご注文いただけます
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}

// cn を使うためインポート
