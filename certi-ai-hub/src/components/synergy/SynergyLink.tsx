"use client"
// src/components/synergy/SynergyLink.tsx
import { ArrowRight, Link2 } from "lucide-react"
import type { SynergyLink } from "@/types"

interface Props {
  links: (SynergyLink & {
    sc_question:  { question: string; category: string }
    aws_question: { question: string; category: string }
  })[]
}

const LINK_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  concept:               { label: "概念の対応",   color: "bg-violet-100 text-violet-700" },
  implementation:        { label: "実装パターン", color: "bg-blue-100 text-blue-700" },
  threat_countermeasure: { label: "脅威 ↔ 対策", color: "bg-red-100 text-red-700" },
}

export function SynergyLinkView({ links }: Props) {
  if (!links.length) return (
    <div className="text-center py-10 text-gray-400">
      <Link2 size={32} className="mx-auto mb-2 opacity-40" />
      <p>シナジーリンクがまだありません</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {links.map(link => {
        const typeInfo = LINK_TYPE_LABEL[link.link_type] ?? { label: link.link_type, color: "bg-gray-100 text-gray-700" }
        return (
          <div key={link.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {/* タイプラベル + 説明 */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className="text-sm font-semibold text-gray-700">{link.description}</span>
            </div>

            {/* SC ↔ AIF */}
            <div className="flex items-center gap-2">
              <span className="bg-sky-100 text-sky-700 text-xs font-bold px-3 py-1 rounded-full">🔒 SC</span>
              <ArrowRight size={14} className="text-amber-400 shrink-0" />
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">☁️ AIF</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
