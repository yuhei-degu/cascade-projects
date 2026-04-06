'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

type RouteType = 'light_normal' | 'light_probe' | 'claude_serious'
interface Msg { role: 'user' | 'assistant'; content: string; ts: number }
const ROUTE_COLOR: Record<RouteType, string> = {
  light_normal:   '#4d8f7a',
  light_probe:    '#c8963c',
  claude_serious: '#6a5b96',
}

const load = <T,>(k: string, d: T): T => {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d } catch { return d }
}
const save = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

function Typing() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8a060', flexShrink: 0, marginBottom: 3 }} />
      <div style={{ background: '#1a1815', border: '1px solid rgba(255,255,255,.07)', borderRadius: '4px 14px 14px 14px', padding: '9px 14px', fontSize: 14 }}>
        <span className="blink-dot" style={{ color: '#c8a060', animationDelay: '0s' }}>・</span>
        <span className="blink-dot" style={{ color: '#c8a060', animationDelay: '.3s' }}>・</span>
        <span className="blink-dot" style={{ color: '#c8a060', animationDelay: '.6s' }}>・</span>
      </div>
    </div>
  )
}

function ChatMsg({ msg }: { msg: Msg }) {
  const ai = msg.role === 'assistant'
  return (
    <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: ai ? 'flex-start' : 'flex-end' }}>
      {ai && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8a060', flexShrink: 0, marginBottom: 3 }} />}
      <div style={{ maxWidth: '76%', fontSize: 14, lineHeight: 1.7, padding: '9px 13px', background: ai ? '#1a1815' : '#231f1b', border: `1px solid ${ai ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'}`, borderRadius: ai ? '4px 14px 14px 14px' : '14px 4px 14px 14px', color: ai ? '#ddd5c5' : '#c5bdb0' }}>
        {msg.content}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [msgs, setMsgs]           = useState<Msg[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [routeType, setRoute]     = useState<RouteType>('light_normal')
  const [prevScores, setPrevScores] = useState<number[]>([])
  const [prevHeavy, setPrevHeavy] = useState(0)
  const [showDev, setShowDev]     = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMsgs(load<Msg[]>('luna_msgs', []).slice(-30))
    setPrevScores(load('luna_scores', []))
    setPrevHeavy(load('luna_heavy', 0))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  // セッション終了検知（5分無操作で日記生成）
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (msgs.length > 0) {
        await fetch('/api/diary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }) })
      }
    }, 5 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [msgs])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Msg = { role: 'user', content: text, ts: Date.now() }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs); setInput(''); setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, prevScores, prevHeavy, history: msgs.slice(-6).map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      const aiMsg: Msg = { role: 'assistant', content: data.reply, ts: Date.now() }
      const finalMsgs = [...newMsgs, aiMsg].slice(-30)
      setMsgs(finalMsgs)
      setRoute(data.routeType ?? 'light_normal')
      setPrevScores(data.prevScores ?? [])
      setPrevHeavy(data.prevHeavy ?? 0)
      save('luna_msgs', finalMsgs)
      save('luna_scores', data.prevScores ?? [])
      save('luna_heavy', data.prevHeavy ?? 0)
    } catch {
      setMsgs(p => [...p, { role: 'assistant', content: 'ちょい待って', ts: Date.now() }])
    } finally { setLoading(false); inputRef.current?.focus() }
  }, [input, loading, msgs, prevScores, prevHeavy])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const orbColor = ROUTE_COLOR[routeType]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0e0d0b', fontFamily: '"Hiragino Sans","Noto Sans JP","Meiryo",sans-serif', color: '#ddd5c5' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="orb-anim" style={{ width: 8, height: 8, borderRadius: '50%', background: orbColor, transition: 'background 1s' }} />
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '.06em' }}>ルナ</span>
        </div>
        <button onClick={() => setShowDev(v => !v)} style={{ fontSize: 10, color: showDev ? '#7a7060' : '#2e2c28', background: 'none', border: 'none', cursor: 'pointer' }}>dev</button>
      </div>

      {/* devパネル */}
      {showDev && (
        <div style={{ background: '#0c0b09', borderBottom: '1px solid rgba(255,255,255,.05)', padding: '6px 16px', fontSize: 10, color: '#5a5450', flexShrink: 0 }}>
          route: <span style={{ color: orbColor }}>{routeType}</span>
          　scores: [{prevScores.join(',')}]　heavy: {prevHeavy}
          　<button onClick={() => fetch('/api/diary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }) })} style={{ fontSize: 10, color: '#4a4640', background: 'none', border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', marginLeft: 8 }}>日記生成</button>
        </div>
      )}

      {/* チャット */}
      <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 && <div style={{ fontSize: 13, color: '#3a3632', textAlign: 'center', marginTop: 40 }}>話しかけてみて</div>}
        {msgs.map((m, i) => <ChatMsg key={i} msg={m} />)}
        {loading && <Typing />}
        <div ref={bottomRef} />
      </div>

      {/* 入力 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="話しかける..." disabled={loading} autoComplete="off"
          style={{ flex: 1, background: '#181511', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '9px 15px', fontSize: 14, color: '#ddd5c5', caretColor: orbColor, fontFamily: 'inherit' }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ width: 34, height: 34, borderRadius: '50%', background: orbColor, border: 'none', color: '#0e0d0b', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, opacity: input.trim() && !loading ? 1 : .22, transition: 'opacity .2s, background 1s' }}>↑</button>
      </div>
    </div>
  )
}
