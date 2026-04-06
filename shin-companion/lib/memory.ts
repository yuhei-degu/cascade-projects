import type { Memory, MemMeta, MemType } from './types'
import { MEM_TYPE_CONFIG } from './constants'

// 3層記憶からフラットな一覧を生成 (TASK-003)
export function getAllMemories(mem: Memory, meta: MemMeta[]) {
  const items: Array<{
    type: MemType | 'mid'
    label: string
    color: string
    content: string
    ts: number
    score: number
  }> = []

  for (const t of MEM_TYPE_CONFIG) {
    for (const content of mem.long[t.key]) {
      const m = meta.find(x => x.type === t.type && x.content === content)
      items.push({ type: t.type, label: t.label, color: t.color, content, ts: m?.ts ?? 0, score: m?.score ?? 3 })
    }
  }
  for (const content of mem.mid) {
    const m = meta.find(x => x.type === 'mid' && x.content === content)
    items.push({ type: 'mid', label: '最近', color: '#4870a0', content, ts: m?.ts ?? 0, score: m?.score ?? 3 })
  }
  return items.sort((a, b) => b.ts - a.ts)
}

// 近似重複検出 (TASK-003)
export function findDuplicates(items: Array<{ content: string }>): Set<string> {
  const s = new Set<string>()
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].content, b = items[j].content
      if (a === b || a.includes(b) || b.includes(a)) { s.add(a); s.add(b) }
    }
  }
  return s
}

// 記憶抽出後の Memory 更新
export function applyExtract(
  mem: Memory,
  type: MemType,
  content: string,
): Memory {
  const nm: Memory = { ...mem, long: { ...mem.long }, mid: [...mem.mid] }
  if (type === 'mid') {
    if (!nm.mid.includes(content)) nm.mid = [...nm.mid, content].slice(-20)
    return nm
  }
  const cfg = MEM_TYPE_CONFIG.find(t => t.type === type)
  if (!cfg) return nm
  if (!nm.long[cfg.key].includes(content)) {
    nm.long[cfg.key] = [...nm.long[cfg.key], content].slice(-10)
  }
  return nm
}

// ホーム画面用ハイライト最大3件 (TASK-002)
export function getHighlights(mem: Memory) {
  const a: Array<{ type: string; content: string; color: string }> = []
  if (mem.long.goals.length > 0)    a.push({ type: '目標',   content: mem.long.goals[0],    color: '#4d8f7a' })
  if (mem.mid.length > 0)           a.push({ type: '最近',   content: mem.mid[mem.mid.length - 1], color: '#4870a0' })
  if (mem.long.values.length > 0)   a.push({ type: '価値観', content: mem.long.values[0],   color: '#c8963c' })
  else if (mem.long.patterns.length > 0) a.push({ type: 'パターン', content: mem.long.patterns[0], color: '#6a5b96' })
  return a.slice(0, 3)
}

export function relativeTime(ts: number): string {
  if (!ts) return '—'
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  const h = Math.floor(d / 3600000)
  const dy = Math.floor(d / 86400000)
  if (m < 1)  return 'たった今'
  if (m < 60) return `${m}分前`
  if (h < 24) return `${h}時間前`
  if (dy < 7) return `${dy}日前`
  return `${Math.floor(dy / 7)}週前`
}
