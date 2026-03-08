// src/app/(public)/start/page.tsx
import Link from "next/link"
import { BEGINNER_STEPS_WINDOWS } from "@/lib/content/beginner-steps"

export default function StartPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-block bg-violet-100 text-violet-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
          🔰 初心者モード
        </div>
        <h1 className="text-3xl font-black mb-3">Claude Codeを始めよう</h1>
        <p className="text-gray-500">「次へ」を押すだけで完了できます。全{BEGINNER_STEPS_WINDOWS.length}ステップ、約30分。</p>
      </div>

      {/* ステップ一覧（ロードマップ） */}
      <div className="space-y-4 mb-10">
        {BEGINNER_STEPS_WINDOWS.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-black flex items-center justify-center flex-shrink-0">
              {step.step}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{step.title}</p>
              <p className="text-xs text-gray-400">約{step.estimatedMinutes ?? 5}分</p>
            </div>
            <span className="text-gray-300 text-sm">⬜</span>
          </div>
        ))}
      </div>

      <Link
        href="/start/1"
        className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-black text-xl text-center py-5 rounded-2xl transition-colors shadow-lg shadow-violet-100"
      >
        STEP 1 から始める →
      </Link>
      <p className="text-center text-xs text-gray-400 mt-4">無料・登録不要で始められます</p>
    </main>
  )
}
