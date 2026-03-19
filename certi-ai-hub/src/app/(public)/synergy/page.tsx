// src/app/(public)/synergy/page.tsx
export const dynamic = "force-dynamic" // DBが更新されても常に最新を取得

import { createServiceClient } from "@/lib/supabase/server"
import { SynergyLinkView } from "@/components/synergy/SynergyLink"

export default async function SynergyPage() {
  const db = createServiceClient()
  const { data: links } = await db
    .from("synergy_links")
    .select(`
      id, link_type, description,
      sc_question:sc_question_id ( question, category ),
      aws_question:aws_question_id ( question, category )
    `)
    .order("link_type")

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          🔗 シナジー学習
        </div>
        <h1 className="text-3xl font-black mb-3">SC × AIF 連携マップ</h1>
        <p className="text-gray-500">支援士（SC）で学ぶ脅威・理論と、AWSで実装する対策の対応関係を確認できます。</p>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { type: "threat_countermeasure", label: "脅威 ↔ 対策", color: "bg-red-100 text-red-700" },
          { type: "concept",               label: "概念の対応",   color: "bg-violet-100 text-violet-700" },
          { type: "implementation",        label: "実装パターン", color: "bg-blue-100 text-blue-700" },
        ].map(t => (
          <span key={t.type} className={`text-xs font-bold px-3 py-1.5 rounded-full ${t.color}`}>
            {t.label}
          </span>
        ))}
      </div>

      <SynergyLinkView links={(links ?? []) as any} />

      {/* リンクが少ない場合の案内 */}
      {(links?.length ?? 0) < 5 && (
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-amber-700 font-bold mb-1">🔗 シナジーリンクを増やすには</p>
          <p className="text-sm text-amber-600">
            Supabase SQL Editor で <code className="bg-amber-100 px-1 rounded">synergy_links</code> テーブルにデータを追加してください。
            Deep Research で生成した問題に <code className="bg-amber-100 px-1 rounded">synergy_hint</code> が含まれている問題同士を紐付けできます。
          </p>
        </div>
      )}
    </main>
  )
}
