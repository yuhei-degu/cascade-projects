"use client"
// src/components/synergy/SynergyLink.tsx — TASK-018
import { useState } from "react"
import { ArrowRight, Link2, ChevronDown, ChevronUp } from "lucide-react"
import type { SynergyLink } from "@/types"

interface Props {
  links: (SynergyLink & {
    sc_question:  { question: string; category: string }
    aws_question: { question: string; category: string }
  })[]
}

const LINK_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  concept:                { label: "概念の対応", color: "bg-violet-100 text-violet-700" },
  implementation:         { label: "実装パターン", color: "bg-blue-100 text-blue-700" },
  threat_countermeasure:  { label: "脅威 ↔ 対策", color: "bg-red-100 text-red-700" },
}

export function SynergyLinkView({ links }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!links.length) return (
    <div className="text-center py-10 text-gray-400">
      <Link2 size={32} className="mx-auto mb-2 opacity-40" />
      <p>シナジーリンクがまだありません</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {links.map(link => {
        const isOpen = expanded === link.id
        const typeInfo = LINK_TYPE_LABEL[link.link_type] ?? { label: link.link_type, color: "bg-gray-100 text-gray-700" }
        return (
          <div key={link.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : link.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-700 line-clamp-1">
                {link.description}
              </span>
              {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isOpen && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {/* SC側 */}
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">🔒 SC</span>
                      <span className="text-xs text-sky-500">{link.sc_question.category}</span>
                    </div>
                    <p className="text-sm text-sky-800 leading-relaxed line-clamp-3">{link.sc_question.question}</p>
                  </div>

                  <div className="hidden sm:flex items-center justify-center">
                    <ArrowRight size={20} className="text-amber-400" />
                  </div>

                  {/* AWS側 */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">☁️ AIF</span>
                      <span className="text-xs text-orange-500">{link.aws_question.category}</span>
                    </div>
                    <p className="text-sm text-orange-800 leading-relaxed line-clamp-3">{link.aws_question.question}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
