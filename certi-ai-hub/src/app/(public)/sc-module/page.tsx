// src/app/(public)/sc-module/page.tsx
"use client"
import Link from "next/link"
import { ShieldCheck, Code2, Brain, Lock } from "lucide-react"
import { SqlInjectionLab } from "@/components/lab/SqlInjectionLab"
import { PromptInjectionLab } from "@/components/lab/PromptInjectionLab"

const CATEGORIES = [
  { key: "ai_threat",  label: "AI閼・ｨ∝ｯｾ遲・,         icon: Brain,       color: "red",    desc: "繝励Ο繝ｳ繝励ヨ繧､繝ｳ繧ｸ繧ｧ繧ｯ繧ｷ繝ｧ繝ｳ繝ｻ繝・・繧ｿ繝昴う繧ｺ繝九Φ繧ｰ繝ｻ繝｢繝・Ν蜿崎ｻ｢謾ｻ謦・ },
  { key: "threat",     label: "閼・ｨ√・謾ｻ謦・焔豕・,      icon: ShieldCheck, color: "orange", desc: "SQLi繝ｻXSS繝ｻCSRF繝ｻ繝輔ぅ繝・す繝ｳ繧ｰ繝ｻ繝槭Ν繧ｦ繧ｧ繧｢" },
  { key: "coding",     label: "繧ｻ繧ｭ繝･繧｢繧ｳ繝ｼ繝・ぅ繝ｳ繧ｰ", icon: Code2,       color: "sky",    desc: "閼・ｼｱ縺ｪ繧ｳ繝ｼ繝峨・迚ｹ螳壹・菫ｮ豁｣繝ｻ繧ｻ繧ｭ繝･繧｢縺ｪ螳溯｣・ヱ繧ｿ繝ｼ繝ｳ" },
  { key: "crypto",     label: "證怜捷繝ｻPKI",           icon: Lock,        color: "violet", desc: "蜈ｬ髢矩嵯證怜捷繝ｻ髮ｻ蟄千ｽｲ蜷阪・TLS繝ｻ險ｼ譏取嶌邂｡逅・ },
  { key: "management", label: "繧ｻ繧ｭ繝･繝ｪ繝・ぅ邂｡逅・,     icon: ShieldCheck, color: "teal",   desc: "ISMS繝ｻ繝ｪ繧ｹ繧ｯ邂｡逅・・繧､繝ｳ繧ｷ繝・Φ繝亥ｯｾ蠢懊・豕戊ｦ丞宛" },
]

const COLORMAP: Record<string, string> = {
  red:    "bg-red-50 border-red-200 text-red-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  sky:    "bg-sky-50 border-sky-200 text-sky-700",
  violet: "bg-violet-50 border-violet-200 text-violet-700",
  teal:   "bg-teal-50 border-teal-200 text-teal-700",
}

const DIFFICULTIES = [
  { value: "",  label: "蜈ｨ蝠城｡・,   icon: "答", desc: "髮｣譏灘ｺｦ縺ｾ縺懊％縺・0蝠・ },
  { value: "1", label: "蠢・亥撫鬘・, icon: "箝・,  desc: "蝓ｺ譛ｬ繝ｻ鬆ｻ蜃ｺ蝠城｡・ },
  { value: "2", label: "讓呎ｺ門撫鬘・, icon: "箝絶ｭ・, desc: "譛ｬ隧ｦ鬨薙Ξ繝吶Ν" },
  { value: "3", label: "髮｣蝠・,     icon: "箝絶ｭ絶ｭ・, desc: "蠢懃畑繝ｻ髮｣蝠上・縺ｿ" },
]

export default function ScModulePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* 繝倥ャ繝繝ｼ */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          白 諠・ｱ蜃ｦ逅・ｮ牙・遒ｺ菫晄髪謠ｴ螢ｫ・・C・・        </div>
        <h1 className="text-3xl font-black mb-3">諠・ｱ蜃ｦ逅・ｮ牙・遒ｺ菫晄髪謠ｴ螢ｫ 蟄ｦ鄙偵Δ繧ｸ繝･繝ｼ繝ｫ</h1>
        <p className="text-gray-500">遘醍岼B髟ｷ譁・・AI閼・ｨ√・繧ｻ繧ｭ繝･繧｢繧ｳ繝ｼ繝・ぅ繝ｳ繧ｰ繧貞ｮ悟・邯ｲ鄒・・026蟷ｴ蠎ｦCBT蟇ｾ蠢懊・/p>
      </div>

      {/* 笏笏 讓｡謫ｬ隧ｦ鬨薙ヰ繝翫・ 笏笏 */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
        <div>
          <p className="text-sky-300 text-sm font-bold mb-1">搭 譛ｬ逡ｪ蠖｢蠑・/p>
          <h2 className="text-xl font-black mb-1">SC 讓｡謫ｬ隧ｦ鬨・/h2>
          <p className="text-sky-200 text-sm">20蝠上・隗｣隱ｬ縺ｪ縺励・蜈ｨ蝠冗ｵゆｺ・ｾ後↓邨先棡・・ｧ｣隱ｬ</p>
        </div>
        <Link href="/common/exam?module=SC&mode=exam"
          className="bg-white text-sky-900 font-black px-5 py-3 rounded-xl hover:bg-sky-50 transition-colors shrink-0">
          髢句ｧ・竊・        </Link>
      </div>

      {/* 笏笏 髮｣譏灘ｺｦ蛻･繧ｹ繧ｿ繝ｼ繝・笏笏 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">髮｣譏灘ｺｦ縺ｧ驕ｸ縺ｶ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DIFFICULTIES.map(d => (
            <Link key={d.value}
              href={`/common/exam?module=SC${d.value ? `&difficulty=${d.value}` : ""}`}
              className="flex flex-col items-center gap-1 p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-brand hover:shadow-md transition-all text-center">
              <span className="text-2xl">{d.icon}</span>
              <span className="font-bold text-sm text-gray-800">{d.label}</span>
              <span className="text-xs text-gray-400">{d.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 笏笏 繧ｫ繝・ざ繝ｪ蛻･蟄ｦ鄙・笏笏 */}
      <h2 className="text-lg font-bold mb-3">繧ｫ繝・ざ繝ｪ縺ｧ驕ｸ縺ｶ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <div key={c.key} className={`p-5 rounded-2xl border-2 ${COLORMAP[c.color]}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={20} />
                <h3 className="font-bold">{c.label}</h3>
              </div>
              <p className="text-xs opacity-70 mb-3 leading-relaxed">{c.desc}</p>
              {/* 繧ｫ繝・ざ繝ｪ ﾃ・髮｣譏灘ｺｦ繝懊ち繝ｳ */}
              <div className="flex gap-2 flex-wrap">
                <Link href={`/common/exam?module=SC&category=${c.key}`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  答 蜈ｨ蝠・                </Link>
                <Link href={`/common/exam?module=SC&category=${c.key}&difficulty=1`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  箝・蠢・・                </Link>
                <Link href={`/common/exam?module=SC&category=${c.key}&difficulty=2`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  箝絶ｭ・讓呎ｺ・                </Link>
                <Link href={`/common/exam?module=SC&category=${c.key}&difficulty=3`}
                  className="text-xs font-bold px-3 py-1.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                  箝絶ｭ絶ｭ・髮｣蝠・                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 繧ｷ繝翫ず繝ｼ繝舌リ繝ｼ */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-center mb-12">
        <div className="text-3xl">迫</div>
        <div>
          <p className="font-bold text-amber-800 mb-1">繧ｷ繝翫ず繝ｼ蟄ｦ鄙・窶・SC ﾃ・AWS</p>
          <p className="text-sm text-amber-700">謾ｯ謠ｴ螢ｫ縺ｧ蟄ｦ縺ｶ逅・ｫ悶′縲、WS縺ｮ縺ｩ縺ｮ繧ｵ繝ｼ繝薙せ縺ｧ螳溯｣・＆繧後ｋ縺狗｢ｺ隱阪〒縺阪∪縺吶・/p>
        </div>
        <Link href="/common/exam?module=MIXED"
          className="ml-auto bg-amber-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-amber-600 shrink-0 text-sm">
          荳｡譁ｹ隗｣縺・        </Link>
      </div>

      {/* 笏笏 Interactive Lab 笏笏 */}
      <div className="mb-4">
        <div className="inline-block bg-red-500/10 text-red-600 text-sm font-bold px-3 py-1.5 rounded-full mb-4">
          捗 Interactive Lab
        </div>
        <h2 className="text-xl font-black mb-1">謾ｻ謦・ｒ菴馴ｨ薙＠縺ｦ逅・ｧ｣縺吶ｋ</h2>
        <p className="text-gray-500 text-sm mb-8">螳滄圀縺ｫ謾ｻ謦・ｒ隧ｦ縺吶％縺ｨ縺ｧ縲・亟蠕｡遲悶・驥崎ｦ∵ｧ繧剃ｽ捺─縺ｧ縺阪∪縺吶・/p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-base font-bold text-gray-700 mb-3">淀・・SQL繧､繝ｳ繧ｸ繧ｧ繧ｯ繧ｷ繝ｧ繝ｳ</h3>
          <SqlInjectionLab />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-700 mb-3">､・繝励Ο繝ｳ繝励ヨ繧､繝ｳ繧ｸ繧ｧ繧ｯ繧ｷ繝ｧ繝ｳ</h3>
          <PromptInjectionLab />
        </div>
      </div>
    </main>
  )
}

