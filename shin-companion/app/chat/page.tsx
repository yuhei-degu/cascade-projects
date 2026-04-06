'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TriggerBubble } from '@/components/TriggerBubble'
import { ChatMessage, TypingIndicator } from '@/components/ChatMessage'
import { StatusBar } from '@/components/StatusBar'
import { SLOT_CONFIG, MOOD_CONFIG, DEFAULT_MEMORY, DEFAULT_CS, DEFAULT_STATE_BUF } from '@/lib/constants'
import { getCurrentSlot } from '@/lib/trigger'
import type { Memory, CharacterState, StateBuf, Message, MemMeta, Slot } from '@/lib/types'

const USER_ID = 'local-user'
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d } catch { return d } }
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

export default function ChatPage() {
  const router = useRouter()
  const [mem, setMem]           = useState<Memory>(DEFAULT_MEMORY)
  const [cs, setCs]             = useState<CharacterState>(DEFAULT_CS)
  const [prevCs, setPrevCs]     = useState<CharacterState>(DEFAULT_CS)
  const [stateBuf, setStateBuf] = useState<StateBuf>(DEFAULT_STATE_BUF)
  const [meta, setMeta]         = useState<MemMeta[]>([])
  const [msgs, setMsgs]         = useState<Message[]>([])
  const [trigger, setTrigger]   = useState('')
  const [slot, setSlot]         = useState<Slot>('day')
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMem(load('mem', DEFAULT_MEMORY))
    setCs(load('cs', DEFAULT_CS))
    setPrevCs(load('cs', DEFAULT_CS))
    setStateBuf(load('sb', DEFAULT_STATE_BUF))
    setMeta(load('meta', []))
    setMsgs(load<Message[]>('msgs', []).slice(-20))
    setTrigger(load('trigger_text', ''))
    setSlot(getCurrentSlot())
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs); setInput(''); setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID, message: text,
          memory: mem, characterState: cs, stateBuf,
          history: msgs.slice(-9), triggerText: trigger, meta,
        }),
      })
      const data = await res.json()
      const aiMsg: Message = { role: 'assistant', content: data.message ?? 'ちょっと待って', ts: Date.now() }
      const finalMsgs = [...newMsgs, aiMsg].slice(-30)
      setMsgs(finalMsgs)
      // undefined ガード: API エラー時に state を壊さない
      if (data.characterState) { setPrevCs(cs); setCs(data.characterState) }
      if (data.stateBuf)       setStateBuf(data.stateBuf)
      if (data.memory)         setMem(data.memory)
      if (data.meta)           setMeta(data.meta)
      save('msgs', finalMsgs)
      if (data.characterState) save('cs', data.characterState)
      if (data.stateBuf)       save('sb', data.stateBuf)
      if (data.memory)         save('mem', data.memory)
      if (data.meta)           save('meta', data.meta)
    } catch {
      setMsgs(p => [...p, { role: 'assistant', content: 'ちょっと待って', ts: Date.now() }])
    } finally {
      setLoading(false); inputRef.current?.focus()
    }
  }, [input, loading, msgs, mem, cs, stateBuf, meta, trigger])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const slotCfg = SLOT_CONFIG[slot]
  const moodCfg = MOOD_CONFIG[cs.mood] ?? MOOD_CONFIG.calm

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="orb-anim" style={{ width: 8, height: 8, borderRadius: '50%', background: slotCfg.orbColor, transition: 'background 1.5s' }} />
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '.06em' }}>シン</span>
          <span style={{ fontSize: 11, color: '#3e3a36', transition: 'color 1s' }}>{moodCfg.label}</span>
          {slotCfg.label && (
            <span style={{ fontSize: 9, color: slotCfg.labelColor, border: `1px solid ${slotCfg.labelColor}40`, borderRadius: 3, padding: '1px 5px', letterSpacing: '.1em' }}>
              {slotCfg.label}
            </span>
          )}
        </div>
        <button onClick={() => router.push('/')} style={{ fontSize: 11, color: '#3a3632', background: 'none', border: 'none', cursor: 'pointer' }}>
          ホーム
        </button>
      </div>

      {/* メッセージエリア */}
      <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 && trigger && <TriggerBubble text={trigger} slot={slot} />}
        {msgs.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ステータスバー */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', padding: '5px 16px', flexShrink: 0 }}>
        <StatusBar label="affinity" value={cs.affinity} color="#c8963c" prevValue={prevCs.affinity} />
        <StatusBar label="trust"    value={cs.trust}    color="#4d8f7a" prevValue={prevCs.trust} />
      </div>

      {/* 入力エリア */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <input
          ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={onKey}
          placeholder="話しかける..." disabled={loading} autoComplete="off"
          style={{ flex: 1, background: '#181511', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '9px 15px', fontSize: 14, color: '#ddd5c5', caretColor: slotCfg.orbColor, fontFamily: 'inherit' }}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ width: 34, height: 34, borderRadius: '50%', background: slotCfg.orbColor, border: 'none', color: '#0e0d0b', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, opacity: input.trim() && !loading ? 1 : .22, transition: 'opacity .2s, background .8s' }}>
          ↑
        </button>
      </div>
    </div>
  )
}
