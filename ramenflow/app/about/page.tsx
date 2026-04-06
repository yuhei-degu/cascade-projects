// app/about/page.tsx
// H3: 店舗紹介・アクセス情報

import { createClient } from '@/lib/supabase/server'
import { PublicLayout } from '@/components/layout/PublicLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '店舗情報',
  description: '店舗の営業時間・アクセス情報です。',
}

export const revalidate = 300

export default async function AboutPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('store_settings')
    .select('store_name, description')
    .single()

  return (
    <PublicLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif font-bold text-3xl text-brand-dark">店舗情報</h1>
        </div>

        {/* 店舗紹介 */}
        {settings?.description && (
          <section className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-serif font-bold text-xl text-brand-dark mb-3">
              {settings.store_name}
            </h2>
            <p className="font-sans text-base text-brand-dark/70 leading-relaxed whitespace-pre-wrap">
              {settings.description}
            </p>
          </section>
        )}

        {/* 基本情報（静的 — 店舗ごとに編集する） */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <h2 className="font-serif font-bold text-xl text-brand-dark">基本情報</h2>

          <InfoRow label="営業時間" value="11:00 〜 22:00（L.O. 21:30）" />
          <InfoRow label="定休日"   value="月曜日（祝日の場合は翌火曜）" />
          <InfoRow label="席数"     value="カウンター8席・テーブル4卓" />
          <InfoRow label="電話"     value="—（電話予約なし）" />

          <p className="font-sans text-xs text-gray-400 pt-2">
            ※ 上記は仮の情報です。管理者が実際の情報に更新してください。
          </p>
        </section>

        {/* アクセス */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-serif font-bold text-xl text-brand-dark mb-3">アクセス</h2>
          <p className="font-sans text-sm text-brand-dark/70">
            〒000-0000<br />
            ○○県○○市○○町 1-2-3<br />
            ○○駅 徒歩5分
          </p>
          <p className="font-sans text-xs text-gray-400 mt-3">
            ※ 住所・アクセス情報は管理者が更新してください。
          </p>

          {/* Googleマップ埋め込み（プレースホルダー） */}
          <div className="mt-4 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
            <p className="font-sans text-sm text-gray-400">
              📍 地図を埋め込む場合はここにGoogle Maps iframeを追加
            </p>
          </div>
        </section>

        {/* トップへ戻るリンク */}
        <div className="text-center pb-4">
          <a href="/" className="font-sans text-sm text-brand-red underline hover:opacity-70">
            ← トップページへ戻る
          </a>
        </div>
      </div>
    </PublicLayout>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="font-sans font-semibold text-brand-dark/50 flex-shrink-0 w-20">{label}</span>
      <span className="font-sans text-brand-dark">{value}</span>
    </div>
  )
}
