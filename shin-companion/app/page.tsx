'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBar } from '@/components/StatusBar'
import { getHighlights } from '@/lib/memory'
import { SLOT_CONFIG, MOOD_CONFIG, DEFAULT_MEMORY, DEFAULT_CS, DEFAULT_STATE_BUF } from '@/lib/constants'
import { getCurrentSlot } from '@/lib/trigger'
import type { Memory, CharacterState, StateBuf, MemMeta, Slot } from '@/lib/types'

const USER_ID = 'local-user' // TODO: Supabase Auth に差し替え

function load<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def } catch { return def }
}
function save(key: string, val: unknown) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val))
}

export default function HomePage() {
  const router = useRouter()
  const [mem, setMem]           = useState<Memory>(DEFAULT_MEMORY)
  const [cs, setCs]             = useState<CharacterState>(DEFAULT_CS)
  const [stateBuf, setStateBuf] = useState<StateBuf>(DEFAULT_STATE_BUF)
  const [meta, setMeta]         = useState<MemMeta[]>([])
  const [trigger, setTrigger]   = useState('')
  const [trigLoading, setTL]    = useState(false)
  const [slot, setSlot]         = useState<Slot>('day')
  const [ready, setReady]       = useState(false)

  const fetchTrigger = useCallback(async (s: Slot, m: Memory, c: CharacterState, force = false) => {
    setTL(true); setSlot(s)
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, slot: s, memory: m, characterState: c, force }),
      })
      const data = await res.json()
      setTrigger(data.trigger ?? 'どうだった？')
      save('trigger_slot', s)
      save('trigger_text', data.trigger)
    } catch { setTrigger('今日はどうだった？') }
    finally { setTL(false) }
  }, [])

  useEffect(() => {
    const m    = load<Memory>('mem', DEFAULT_MEMORY)
    const c    = load<CharacterState>('cs', DEFAULT_CS)
    const sb   = load<StateBuf>('sb', DEFAULT_STATE_BUF)
    const mt   = load<MemMeta[]>('meta', [])
    const text = load<string>('trigger_text', '')
    const s    = getCurrentSlot()
    setMem(m); setCs(c); setStateBuf(sb); setMeta(mt); setSlot(s)
    if (text) { setTrigger(text); setReady(true) }
    else      { fetchTrigger(s, m, c).then(() => setReady(true)) }
  }, [fetchTrigger])

  const total = Object.values(mem.long).reduce((s, a) => s + a.length, 0) + mem.mid.length
  const highlights = getHighlights(mem)
  const slotCfg = SLOT_CONFIG[slot]
  const moodCfg = MOOD_CONFIG[cs.mood] ?? MOOD_CONFIG.calm

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <div className="orb-anim" style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8963c' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px 10px', flexShrink: 0 }}>
        <div className="orb-anim" style={{ width: 8, height: 8, borderRadius: '50%', background: slotCfg.orbColor, transition: 'background 1.5s' }} />
        <span style={{ fontSize: 13, color: '#5a5450', letterSpacing: '.06em' }}>シン</span>
      </div>

      {/* 今日の一言 */}
      <div style={{ padding: '0 20px 18px', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: slotCfg.label ? slotCfg.labelColor : '#2e2c28', letterSpacing: '.14em', fontWeight: slotCfg.label ? 600 : 400, marginBottom: 8 }}>
          {slotCfg.label ? `${slotCfg.label}の一言` : '今日の一言'}
        </div>
        <div style={{ background: '#121110', border: `1px solid ${slotCfg.triggerBorder}`, borderRadius: 14, padding: '16px 18px', minHeight: 60, display: 'flex', alignItems: 'center' }}>
          {trigLoading
            ? <span style={{ color: '#3a3632' }}>...</span>
            : <span style={{ fontSize: 17, color: slotCfg.triggerTextColor, lineHeight: 1.6 }}>{trigger}</span>}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.04)', margin: '0 0 16px', flexShrink: 0 }} />

      {/* 状態 */}
      <div style={{ padding: '0 20px 18px', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: '#2e2c28', letterSpacing: '.12em', marginBottom: 10 }}>状態</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: moodCfg.color, transition: 'background 1s' }} />
          <span style={{ fontSize: 13, color: '#6a6258' }}>{moodCfg.label}</span>
          <span style={{ fontSize: 9, color: '#2e2c28' }}>{stateBuf.moodBuffer.length}/5 votes</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <StatusBar label="affinity" value={cs.affinity} color="#c8963c" />
          <StatusBar label="trust"    value={cs.trust}    color="#4d8f7a" />
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.04)', margin: '0 0 16px', flexShrink: 0 }} />

      {/* 記憶ハイライト */}
      <div style={{ padding: '0 20px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: '#2e2c28', letterSpacing: '.12em' }}>記憶</div>
          {total > 0 && (
            <button onClick={() => router.push('/memories')} style={{ fontSize: 9, color: '#4a4640', background: 'none', border: 'none', cursor: 'pointer' }}>
              全て見る ({total})
            </button>
          )}
        </div>
        {highlights.length === 0
          ? <p style={{ fontSize: 12, color: '#2e2c28', lineHeight: 1.8 }}>話すほど、シンはあなたのことを覚えていく。</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {highlights.map((h, i) => (
                <div key={i} className="fade-up" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 9, color: h.color, fontWeight: 600, letterSpacing: '.1em', minWidth: 36, paddingTop: 2 }}>{h.type}</span>
                  <span style={{ fontSize: 12, color: '#5a5450', lineHeight: 1.65, flex: 1 }}>{h.content}</span>
                </div>
              ))}
            </div>}
      </div>

      {/* 話すボタン */}
      <div style={{ padding: '16px 20px 20px', flexShrink: 0 }}>
        <button onClick={() => router.push('/chat')}
          style={{ width: '100%', padding: 13, background: '#161411', border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, color: '#ddd5c5', fontSize: 14, cursor: 'pointer', letterSpacing: '.08em' }}>
          話す
        </button>
      </div>
    </div>
  )
}
