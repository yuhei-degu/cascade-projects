"use client"
// src/components/learn/CommandBlock.tsx
// コピー可能なコマンドブロック

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface Props {
  command: string
  label?: string
  expected?: string
}

export function CommandBlock({ command, label, expected }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-200">
      {label && (
        <div className="bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
          {label}
        </div>
      )}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between gap-4">
        <code className="text-green-400 font-mono text-sm flex-1 break-all">{command}</code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
      {expected && (
        <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
          ✅ 成功すると: <span className="text-gray-300">{expected}</span>
        </div>
      )}
    </div>
  )
}
