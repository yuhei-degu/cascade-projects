// src/app/(public)/start/[step]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { BEGINNER_STEPS_WINDOWS } from "@/lib/content/beginner-steps"
import { CommandBlock } from "@/components/learn/CommandBlock"
import { AskAI } from "@/components/learn/AskAI"

export function generateStaticParams() {
  return BEGINNER_STEPS_WINDOWS.map((s) => ({ step: String(s.step) }))
}

export default function StepPage({ params }: { params: { step: string } }) {
  const stepNum = parseInt(params.step, 10)
  const step = BEGINNER_STEPS_WINDOWS.find((s) => s.step === stepNum)
  if (!step) return notFound()

  const total = BEGINNER_STEPS_WINDOWS.length
  const progress = Math.round((stepNum / total) * 100)
  const nextStep = BEGINNER_STEPS_WINDOWS.find((s) => s.step === stepNum + 1)
  const isLast = stepNum === total

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* 進捗バー */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>STEP {stepNum} / {total}</span>
          <span>{progress}% 完了</span>
        </div>
        <div className="bg-gray-100 rounded-full h-2">
          <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ① やること */}
      <h1 className="text-2xl font-black mb-2">{step.title}</h1>

      {/* ② なぜ必要か */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-xs font-bold text-amber-600 mb-1">💡 なぜ必要か</p>
        <p className="text-sm text-amber-800 leading-relaxed">{step.why}</p>
      </div>

      {/* ⑤ コマンド */}
      {step.commands && step.commands.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-700 mb-2">⌨️ 実行するコマンド</p>
          {step.commands.map((c) => (
            <CommandBlock key={c.cmd} command={c.cmd} label={c.label} expected={c.expected} />
          ))}
        </div>
      )}

      {/* ⑥⑦ よくある失敗と解決 */}
      {step.commonErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-red-600 mb-3">⚠️ よくある失敗と解決方法</p>
          <div className="space-y-3">
            {step.commonErrors.map((e) => (
              <div key={e.error} className="text-sm">
                <p className="font-mono text-red-700 bg-red-100 px-2 py-1 rounded mb-1">{e.error}</p>
                <p className="text-red-600">→ {e.solution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AIサポート */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-gray-500">わからないことがあれば…</p>
        <AskAI stepId={step.id} />
      </div>

      {/* ナビゲーション */}
      <div className="flex gap-3">
        {stepNum > 1 && (
          <Link href={`/start/${stepNum - 1}`}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-4 rounded-2xl text-center hover:border-gray-300 transition-colors">
            ← 前へ
          </Link>
        )}
        {isLast ? (
          <Link href="/start/complete"
            className="flex-1 bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-2xl text-center transition-colors shadow-lg">
            🎉 完了！
          </Link>
        ) : (
          <Link href={`/start/${stepNum + 1}`}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-2xl text-center transition-colors shadow-lg">
            次へ進む →
          </Link>
        )}
      </div>
    </main>
  )
}
