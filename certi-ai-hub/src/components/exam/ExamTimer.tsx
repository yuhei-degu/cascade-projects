"use client"
// src/components/exam/ExamTimer.tsx — TASK-009
import { useEffect, useState } from "react"
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

  useEffect(() => {
    if (paused) return
    if (remaining <= 0) { onTimeUp(); return }
    const id = setInterval(() => setRemaining(r => {
      if (r <= 1) { clearInterval(id); onTimeUp(); return 0 }
      return r - 1
    }), 1000)
    return () => clearInterval(id)
  }, [paused, remaining, onTimeUp])

  const pct     = (remaining / timeLimitSeconds) * 100
  const warning = remaining <= 300  // 5分
  const danger  = remaining <= 60   // 1分

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 font-mono font-bold text-lg transition-colors
      ${danger  ? "bg-red-50 border-red-400 text-red-600 animate-pulse" :
        warning ? "bg-amber-50 border-amber-400 text-amber-600" :
                  "bg-white border-gray-200 text-gray-700"}`}>
      {warning
        ? <AlertTriangle size={20} className={danger ? "text-red-500" : "text-amber-500"} />
        : <Clock size={20} className="text-gray-400" />}
      <span>{fmt(remaining)}</span>
      {/* プログレスバー */}
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
