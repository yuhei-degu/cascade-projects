'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MemoryCard } from '@/components/MemoryCard'
import { getAllMemories, findDuplicates } from '@/lib/memory'
import { MEM_TYPE_CONFIG, DEFAULT_MEMORY } from '@/lib/constants'
import type { Memory, MemMeta, MemType } from '@/lib/types'

type FilterKey = 'all' | MemType
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全て' }, { key: 'goal', label: '目標' },
  { key: 'value', label: '価値観' }, { key: 'pattern', label: 'パターン' },
  { key: 'trigger', label: '感情' }, { key: 'mid', label: '最近' },
]

const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d } catch { return d } }
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

export default function MemoriesPage() {
  const router = useRouter()
  const [mem, setMem]   = useState<Memory>(DEFAULT_MEMORY)
  const [meta, setMeta] = useState<MemMeta[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    setMem(load('mem', DEFAULT_MEMORY))
    setMeta(load('meta', []))
  }, [])

  const all  = getAllMemories(mem, meta)
  const dups = findDuplicates(all)
  const shown = filter === 'all' ? all : all.filter(m => m.type === filter)
  const dupCount = dups.size

  const handleDelete = useCallback((type: string, content: string) => {
    const nm: Memory = { ...mem, long: { ...mem.long }, mid: [...mem.mid] }
    if (type === 'mid') {
      nm.mid = nm.mid.filter(c => c !== content)
    } else {
      const t = MEM_TYPE_CONFIG.find(t => t.type === type)
      if (t) nm.long[t.key] = nm.long[t.key].filter(c => c !== content)
    }
    const nm2 = meta.filter(m => !(m.type === type && m.content === content))
    setMem(nm); setMeta(nm2); save('mem', nm); save('meta', nm2)
  }, [mem, meta])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '.06em' }}>記憶</span>
          <span style={{ fontSize: 11, color: '#3a3632' }}>{all.length}件</span>
          {dupCount > 0 && (
            <span style={{ fontSize: 9, color: '#c8963c', border: '1px solid rgba(200,150,60,.3)', borderRadius: 3, padding: '1px 5px' }}>
              近似 {dupCount}
            </span>
          )}
        </div>
        <button onClick={() => router.push('/')} style={{ fontSize: 11, color: '#3a3632', background: 'none', border: 'none', cursor: 'pointer' }}>
          ホーム
        </button>
      </div>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: 5, padding: '8px 16px', flexShrink: 0, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${filter === f.key ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.06)'}`, background: filter === f.key ? 'rgba(255,255,255,.07)' : 'none', color: filter === f.key ? '#ddd5c5' : '#4a4640', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* 記憶一覧 */}
      <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
        {shown.length === 0
          ? <p style={{ fontSize: 12, color: '#2e2c28', textAlign: 'center', marginTop: 48 }}>この種類の記憶はまだない</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {shown.map((item, i) => (
                <div key={i} className="fade-up">
                  <MemoryCard
                    {...item}
                    isDuplicate={dups.has(item.content)}
                    onDelete={() => handleDelete(item.type, item.content)}
                  />
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}
