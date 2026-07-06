'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import LunariaPortrait from '@/components/character/LunariaPortrait'
import {
  type LunariaExpression,
  type LunariaMotion,
  isLunariaExpression,
  isLunariaMotion,
} from '@/lib/lunaria/visual-state'

type RouteType = 'light_normal' | 'light_probe' | 'claude_serious'
interface Msg { role: 'user' | 'assistant'; content: string; ts: number }
interface AssistantMeta {
  emotion?: string
  expression?: string
  motion?: string
  voice_tone?: string
  topic_tags?: string[]
  next_step?: string
}
interface AssistantVisualState {
  expression: LunariaExpression
  motion: LunariaMotion
  label: string
}
const ROUTE_COLOR: Record<RouteType, string> = {
  light_normal:   '#4d8f7a',
  light_probe:    '#c8963c',
  claude_serious: '#6a5b96',
}

const VISUAL_LABELS: Record<string, string> = {
  warm: 'あたたかい',
  playful: '遊び心',
  sad: '悲しみ',
  serious: '真剣',
  calm: '落ち着き',
  surprised: '驚き',
  relieved: '安心',
  worried: '心配',
  thinking: '考え中',
}

const EXPRESSION_LABELS: Record<string, string> = {
  normal: '通常',
  smile: '笑顔',
  gentle_smile: 'やさしい笑顔',
  teasing: 'からかい',
  surprised: '驚き',
  thinking: '考え中',
  sad: '悲しみ',
  serious: '真剣',
  embarrassed: '照れ',
  sleepy: '眠そう',
  excited: 'うれしそう',
  relieved: 'ほっとした',
}

const MOTION_LABELS: Record<string, string> = {
  idle: '待機',
  tilt_head: '首をかしげる',
  nod: 'うなずく',
  shake_head: '首を振る',
  look_away: '目をそらす',
  lean_forward: '身を乗り出す',
  close_eyes: '目を閉じる',
  small_wave: '小さく手を振る',
  arms_crossed: '腕を組む',
  soft_laugh: 'やわらかく笑う',
}

const load = <T,>(k: string, d: T): T => {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d } catch { return d }
}
const save = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

function visualFromAssistant(meta: AssistantMeta | null | undefined, routeType: RouteType): AssistantVisualState {
  const expressionFromEmotion: Record<string, LunariaExpression> = {
    warm: 'gentle_smile',
    playful: 'teasing',
    sad: 'sad',
    serious: 'serious',
    calm: 'gentle_smile',
    surprised: 'surprised',
    relieved: 'relieved',
    worried: 'thinking',
  }
  const routeFallback: Record<RouteType, AssistantVisualState> = {
    light_normal: { expression: 'gentle_smile', motion: 'idle', label: 'warm' },
    light_probe: { expression: 'thinking', motion: 'tilt_head', label: 'thinking' },
    claude_serious: { expression: 'serious', motion: 'lean_forward', label: 'serious' },
  }
  const fallback = routeFallback[routeType]
  const expression = isLunariaExpression(meta?.expression)
    ? meta.expression
    : expressionFromEmotion[String(meta?.emotion ?? '')] ?? fallback.expression
  const motion = isLunariaMotion(meta?.motion) ? meta.motion : fallback.motion
  return {
    expression,
    motion,
    label: meta?.emotion || meta?.voice_tone || fallback.label,
  }
}

function Typing() {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" aria-label="Lunariaが返信中" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8a060', flexShrink: 0, marginBottom: 3 }} />
      <div style={{ background: '#1a1815', border: '1px solid rgba(255,255,255,.07)', borderRadius: '4px 14px 14px 14px', padding: '9px 14px', fontSize: 14 }}>
        <span aria-hidden="true" className="blink-dot" style={{ color: '#c8a060', animationDelay: '0s' }}>・</span>
        <span aria-hidden="true" className="blink-dot" style={{ color: '#c8a060', animationDelay: '.3s' }}>・</span>
        <span aria-hidden="true" className="blink-dot" style={{ color: '#c8a060', animationDelay: '.6s' }}>・</span>
      </div>
    </div>
  )
}

function ChatMsg({ msg }: { msg: Msg }) {
  const ai = msg.role === 'assistant'
  return (
    <div className="fade-up" aria-label={ai ? 'Lunariaのメッセージ' : 'あなたのメッセージ'} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: ai ? 'flex-start' : 'flex-end' }}>
      {ai && <div aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8a060', flexShrink: 0, marginBottom: 3 }} />}
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
  const [prevScores, setPrevScores]           = useState<number[]>([])
  const [prevHeavy, setPrevHeavy]             = useState(0)
  const [lastSeriousAt, setLastSeriousAt]     = useState(0)
  const [showDev, setShowDev]                 = useState(false)
  const [consecutiveTopicCount, setConsCount] = useState(0)
  const [lastTopic, setLastTopic]             = useState('other')
  const [lastSubtopic, setLastSub]            = useState('unknown')
  const [coverage, setCoverage]               = useState<any>({
    work: false, health: false, meal: false,
    relation: false, hobby: false, tomorrow: false, small_positive: false,
  })
  const [convMode, setConvMode]               = useState<string>('continue')
  const [userName, setUserName]               = useState<string>('')
  const [ticketToast, setTicketToast]         = useState<string | null>(null)
  const [assistantVisual, setAssistantVisual] = useState<AssistantVisualState>(() => visualFromAssistant(null, 'light_normal'))
  const [assistantNextStep, setAssistantNextStep] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // DB から履歴を取得（リロード後も続きから話せる）
    fetch('/api/messages')
      .then(r => r.json())
      .then(data => {
        if (data.messages?.length > 0) {
          setMsgs(data.messages)
        } else {
          setMsgs(load<Msg[]>('luna_msgs', []).slice(-30))
        }
      })
      .catch(() => setMsgs(load<Msg[]>('luna_msgs', []).slice(-30)))
    setPrevScores(load('luna_scores', []))
    setPrevHeavy(load('luna_heavy', 0))
    setLastSeriousAt(load('luna_lastSeriousAt', 0))
    setConsCount(load('luna_consCount', 0))
    setLastTopic(load('luna_lastTopic', 'other'))
    setLastSub(load('luna_lastSub', 'unknown'))
    setCoverage(load('luna_coverage', {
      work: false, health: false, meal: false,
      relation: false, hobby: false, tomorrow: false, small_positive: false,
    }))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [msgs, loading])

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
    setMsgs(newMsgs); setInput(''); setLoading(true); setAssistantNextStep('')

    // 受信開始したら typing インジケータを切って placeholder を出す
    let placeholderInserted = false
    let live = ''
    const ensurePlaceholder = () => {
      if (placeholderInserted) return
      placeholderInserted = true
      setLoading(false)
      setMsgs(p => [...p, { role: 'assistant', content: '', ts: Date.now() }])
    }
    const updateLive = (next: string) => {
      live = next
      setMsgs(p => {
        if (p.length === 0) return p
        const last = p[p.length - 1]
        if (last.role !== 'assistant') return p
        return [...p.slice(0, -1), { ...last, content: next }]
      })
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, prevScores, prevHeavy, lastSeriousAt,
          history: msgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          consecutiveTopicCount, lastTopic, lastSubtopic, coverage,
        }),
      })
      if (!res.ok || !res.body) throw new Error(`http ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      // NDJSON：1行 = 1イベント
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let nl
        while ((nl = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (!line) continue
          let event: any
          try { event = JSON.parse(line) } catch { continue }
          if (event.type === 'chunk') {
            ensurePlaceholder()
            updateLive(live + (event.text ?? ''))
          } else if (event.type === 'replace') {
            ensurePlaceholder()
            updateLive(event.text ?? '')
          } else if (event.type === 'done') {
            ensurePlaceholder()
            const d = event.data ?? {}
            // canonical reply で確定（途中の chunk と差があれば snap）
            if (typeof d.reply === 'string' && d.reply !== live) updateLive(d.reply)

            setMsgs(p => p.slice(-30))
            setRoute(d.routeType ?? 'light_normal')
            setPrevScores(d.prevScores ?? [])
            setPrevHeavy(d.prevHeavy ?? 0)
            setLastSeriousAt(d.lastSeriousAt ?? lastSeriousAt)
            setConsCount(d.consecutiveTopicCount ?? 0)
            setLastTopic(d.lastTopic ?? 'other')
            setLastSub(d.lastSubtopic ?? 'unknown')
            setCoverage(d.coverage ?? coverage)
            setConvMode(d.conversationMode ?? 'continue')
            const nextAssistantMeta = d.assistantMeta ?? null
            setAssistantVisual(visualFromAssistant(nextAssistantMeta, d.routeType ?? 'light_normal'))
            setAssistantNextStep(typeof nextAssistantMeta?.next_step === 'string' ? nextAssistantMeta.next_step.trim() : '')
            if (d.userName) setUserName(d.userName)
            save('luna_scores', d.prevScores ?? [])
            save('luna_heavy', d.prevHeavy ?? 0)
            save('luna_lastSeriousAt', d.lastSeriousAt ?? lastSeriousAt)
            save('luna_consCount', d.consecutiveTopicCount ?? 0)
            save('luna_lastTopic', d.lastTopic ?? 'other')
            save('luna_lastSub', d.lastSubtopic ?? 'unknown')
            save('luna_coverage', d.coverage ?? coverage)

            // ガチャチケット獲得通知（3 秒間トースト表示）
            if (d.ticketGranted) {
              setTicketToast(`🎟 ガチャ券もらった！（${d.ticketTotal ?? '?'}枚）`)
              setTimeout(() => setTicketToast(null), 3000)
            }
          }
        }
      }
      // 何も来ずに終わった保険
      if (!placeholderInserted) {
        setMsgs(p => [...p, { role: 'assistant', content: 'ちょい待って', ts: Date.now() }])
      }
    } catch {
      if (!placeholderInserted) {
        setMsgs(p => [...p, { role: 'assistant', content: 'ちょい待って', ts: Date.now() }])
      }
    } finally { setLoading(false); inputRef.current?.focus() }
  }, [input, loading, msgs, prevScores, prevHeavy, lastSeriousAt, consecutiveTopicCount, lastTopic, lastSubtopic, coverage])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const orbColor = ROUTE_COLOR[routeType]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0e0d0b', fontFamily: '"Hiragino Sans","Noto Sans JP","Meiryo",sans-serif', color: '#ddd5c5' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div aria-hidden="true" className="orb-anim" style={{ width: 8, height: 8, borderRadius: '50%', background: orbColor, transition: 'background 1s' }} />
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '.06em' }}>ルナ</span>
        </div>
        <nav aria-label="Lunariaのナビゲーション" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/diary" aria-label="日記を開く" style={{ fontSize: 12, color: '#7a7060', textDecoration: 'none' }}>日々</a>
          <a href="/memory" aria-label="記憶を開く" style={{ fontSize: 12, color: '#7a7060', textDecoration: 'none' }}>記憶</a>
          <a href="/character" aria-label="姿を開く" style={{ fontSize: 12, color: '#7a7060', textDecoration: 'none' }}>姿</a>
          <a href="/items" aria-label="品を開く" style={{ fontSize: 12, color: '#7a7060', textDecoration: 'none' }}>品</a>
          <a href="/games" aria-label="ゲームを開く" style={{ fontSize: 12, color: '#7a7060', textDecoration: 'none' }}>ゲーム</a>
          <a href="/gacha" aria-label="ガチャを開く" style={{ fontSize: 12, color: '#7a7060', textDecoration: 'none' }}>🎟</a>
          <button onClick={() => setShowDev(v => !v)} aria-label="開発者向け診断の表示を切り替える" aria-pressed={showDev} style={{ fontSize: 10, color: showDev ? '#7a7060' : '#2e2c28', background: 'none', border: 'none', cursor: 'pointer' }}>診断</button>
        </nav>
      </div>

      {/* ガチャチケット獲得トースト */}
      {ticketToast && (
        <div role="status" aria-live="polite" aria-atomic="true" aria-label="ガチャ券を受け取りました" style={{
          position: 'fixed', top: 50, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(127,179,213,0.15)', border: '1px solid rgba(127,179,213,0.4)',
          color: '#7fb3d5', borderRadius: 20, padding: '6px 14px', fontSize: 12,
          zIndex: 200, animation: 'fadeUp .35s ease-out',
        }}>
          {ticketToast}
        </div>
      )}

      {/* devパネル */}
      <div role="group" aria-live="polite" aria-atomic="true" aria-label="Lunariaの現在の気分" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,.04)',
        background: 'linear-gradient(90deg, rgba(200,160,96,.06), rgba(127,179,213,.035))',
        flexShrink: 0,
      }}>
        <LunariaPortrait expression={assistantVisual.expression} motion={assistantVisual.motion} size="sm" />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#c8a060', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>ルナの気分</div>
          <div style={{ color: '#8f8372', fontSize: 12, marginTop: 2 }}>
            {VISUAL_LABELS[assistantVisual.label] ?? assistantVisual.label} / {EXPRESSION_LABELS[assistantVisual.expression] ?? assistantVisual.expression} / {MOTION_LABELS[assistantVisual.motion] ?? assistantVisual.motion}
          </div>
          {assistantNextStep && (
            <div role="status" aria-live="polite" aria-atomic="true" aria-label="Lunariaからの次の提案" style={{ color: '#bba989', fontSize: 12, lineHeight: 1.45, marginTop: 4, maxWidth: 'min(64vw, 520px)', overflowWrap: 'anywhere' }}>
              次: {assistantNextStep}
            </div>
          )}
        </div>
      </div>

      {showDev && (
        <div style={{ background: '#0c0b09', borderBottom: '1px solid rgba(255,255,255,.05)', padding: '8px 16px', fontSize: 11, color: '#5a5450', flexShrink: 0, lineHeight: 1.8 }}>
          <div>
            <span style={{ color: '#888', marginRight: 6 }}>ルート</span>
            <span style={{
              color: '#fff', background: orbColor,
              padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
            }}>
              {routeType === 'light_normal' ? '💬 通常' : routeType === 'light_probe' ? '👀 probe' : '🔴 serious'}
            </span>
            <span style={{ color: '#555', margin: '0 8px' }}>|</span>
            <span style={{ color: '#888', marginRight: 6 }}>モード</span>
            <span style={{ color: '#8a7' }}>{convMode}</span>
            {userName && <><span style={{ color: '#555', margin: '0 8px' }}>|</span><span style={{ color: '#c8a060' }}>{userName}</span></>}
          </div>
          <div>
            <span style={{ color: '#888', marginRight: 6 }}>話題</span>{lastTopic}/{lastSubtopic}
            <span style={{ color: '#555', margin: '0 8px' }}>|</span>
            <span style={{ color: '#888', marginRight: 6 }}>スコア</span>
            {prevScores.map((s, i) => (
              <span key={i} style={{ color: s >= 4 ? '#e87' : s >= 2 ? '#ca7' : '#556', marginRight: 3 }}>{s}</span>
            ))}
            <span style={{ color: '#888', marginLeft: 6, marginRight: 4 }}>重め</span>
            <span style={{ color: prevHeavy >= 2 ? '#e87' : '#556' }}>{prevHeavy}</span>
          </div>
          <div>
            <span style={{ color: '#888', marginRight: 6 }}>クールダウン残り</span>
            <span style={{ color: lastSeriousAt > 0 && (Date.now() - lastSeriousAt < 15*60*1000) ? '#e87' : '#556' }}>
              {lastSeriousAt > 0 ? Math.max(0, Math.ceil((lastSeriousAt + 15*60*1000 - Date.now()) / 60000)) + '分' : '-'}
            </span>
            <span style={{ color: '#555', margin: '0 8px' }}>|</span>
            <button onClick={() => fetch('/api/diary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }) })}
              style={{ fontSize: 10, color: '#4a4640', background: 'none', border: '1px solid rgba(255,255,255,.08)', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}>日記生成</button>
          </div>
        </div>
      )}

      {/* チャット */}
      <div id="lunaria-conversation-log" className="scroll-thin" role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions text" aria-label="Lunariaとの会話" aria-busy={loading} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 && <div role="note" aria-label="Lunariaに話しかける" style={{ fontSize: 13, color: '#3a3632', textAlign: 'center', marginTop: 40 }}>話しかけてみて</div>}
        {msgs.map((m, i) => <ChatMsg key={`${m.role}-${m.ts}-${i}`} msg={m} />)}
        {loading && <Typing />}
        <div ref={bottomRef} />
      </div>

      {/* 入力 */}
      <div role="group" aria-label="Lunariaへのメッセージ入力" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="話しかける..." disabled={loading} autoComplete="off" aria-label="Lunariaへのチャットメッセージ" aria-keyshortcuts="Enter" aria-controls="lunaria-conversation-log" enterKeyHint="send"
          style={{ flex: 1, background: '#181511', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '9px 15px', fontSize: 14, color: '#ddd5c5', caretColor: orbColor, fontFamily: 'inherit' }} />
        <button onClick={send} disabled={!input.trim() || loading} aria-label="Lunariaにメッセージを送る"
          style={{ width: 34, height: 34, borderRadius: '50%', background: orbColor, border: 'none', color: '#0e0d0b', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, opacity: input.trim() && !loading ? 1 : .22, transition: 'opacity .2s, background 1s' }}>↑</button>
      </div>
    </div>
  )
}
