"use client"
// src/components/exam/ExamTimer.tsx
import { useEffect, useRef, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface Props {
  timeLimitSeconds: number
  onTimeUp: () => void
  paused?: boolean
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0")
  const s = (sec % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export function ExamTimer({ timeLimitSeconds, onTimeUp, paused }: Props) {
  const [remaining, setRemaining] = useState(timeLimitSeconds)
  const onTimeUpRef  = useRef(onTimeUp)
  const firedRef     = useRef(false)   // タイムアップ発火済みフラグ

  // onTimeUp が変わっても常に最新を参照（再レンダーでも effect を再実行しない）
  useEffect(() => { onTimeUpRef.current = onTimeUp }, [onTimeUp])

  useEffect(() => {
    firedRef.current = false   // 問題が変わったらフラグリセット

    if (paused) return

    const id = setInterval(() => {
      setRemaining(r => {
        const next = r - 1
        if (next <= 0) {
          clearInterval(id)
          if (!firedRef.current) {
            firedRef.current = true
            onTimeUpRef.current()   // 必ず1回だけ呼ぶ
          }
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(id)
  }, [paused])  // ← remaining も onTimeUp も依存配列に入れない

  const pct     = (remaining / timeLimitSeconds) * 100
  const warning = pct <= 50
  const danger  = pct <= 20

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 font-mono font-bold text-lg transition-colors
      ${danger  ? "bg-red-50 border-red-400 text-red-600 animate-pulse" :
        warning ? "bg-amber-50 border-amber-400 text-amber-600" :
                  "bg-white border-gray-200 text-gray-700"}`}>
      {warning
        ? <AlertTriangle size={20} className={danger ? "text-red-500" : "text-amber-500"} />
        : <Clock size={20} className="text-gray-400" />}
      <span>{fmt(remaining)}</span>
      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000
            ${danger ? "bg-red-500" : warning ? "bg-amber-400" : "bg-brand"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
