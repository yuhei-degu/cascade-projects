// app/admin/settings/page.tsx
// A4: 店舗設定画面
// 営業状態 / スタッフ人数 / 同時調理可能数 / 店舗名・紹介文

import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StoreStatusToggle } from '@/components/admin/StoreStatusToggle'
import { SettingsForm } from '@/components/admin/SettingsForm'
import type { StoreStatus } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .single()

  return (
    <AdminLayout title="店舗設定">
      <div className="space-y-8 max-w-lg">

        {/* ---- 営業状態 ---- */}
        <section>
          <h2 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wide mb-3">
            営業状態
          </h2>
          <StoreStatusToggle
            currentStatus={(settings?.status ?? 'closed') as StoreStatus}
            storeName={settings?.store_name ?? 'ラーメン店'}
          />
        </section>

        {/* ---- 基本設定フォーム ---- */}
        <section>
          <h2 className="font-sans font-bold text-sm text-gray-400 uppercase tracking-wide mb-3">
            基本設定
          </h2>
          <SettingsForm
            defaultValues={{
              store_name: settings?.store_name ?? '',
              description: settings?.description ?? '',
              staff_count: settings?.staff_count ?? 1,
              parallel_cooking_capacity: settings?.parallel_cooking_capacity ?? 3,
            }}
          />
        </section>

        {/* ---- 説明テキスト ---- */}
        <section className="bg-brand-light rounded-2xl p-4 text-sm font-sans text-brand-dark/60 space-y-2">
          <p className="font-bold text-brand-dark">⚙️ 設定の目安</p>
          <p>
            <span className="font-semibold">スタッフ人数</span>：
            実際に調理・ホールに立つ人数を入力してください。待ち時間の計算に使われます。
          </p>
          <p>
            <span className="font-semibold">同時調理可能数</span>：
            コンロや鍋の数が目安です。ラーメン1〜2人なら3〜4、多い場合は6以上。
          </p>
        </section>
      </div>
    </AdminLayout>
  )
}
