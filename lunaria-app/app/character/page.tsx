'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import LunariaPortrait, { type LunariaExpression, type LunariaMotion } from '@/components/character/LunariaPortrait'

type CharacterStateResponse = {
  character_profile_id: string
  current_outfit_id: string
  current_outfit_name: string
  current_background_id: string
  current_background_name: string
  current_expression: string
  current_motion: string
  affinity_level: number
  affinity_streak_days: number
  unlocked_expressions: string[]
  unlocked_motions: string[]
  total_items_owned: number
  total_items_pool: number
  last_interaction_at: string | null
  source: 'character_states' | 'mock'
  db_ready: boolean
  note: string
}

const EXPRESSIONS: LunariaExpression[] = ['normal', 'smile', 'gentle_smile', 'teasing', 'surprised', 'thinking', 'sad', 'serious', 'embarrassed', 'sleepy', 'excited', 'relieved']
const MOTIONS: LunariaMotion[] = ['idle', 'tilt_head', 'nod', 'shake_head', 'look_away', 'lean_forward', 'close_eyes', 'small_wave', 'arms_crossed', 'soft_laugh']
const FALLBACK_STATE: CharacterStateResponse = {
  character_profile_id: 'lunaria',
  current_outfit_id: 'outfit_default',
  current_outfit_name: 'Moonlit Uniform',
  current_background_id: 'bg_window_night',
  current_background_name: 'Night Window',
  current_expression: 'gentle_smile',
  current_motion: 'idle',
  affinity_level: 47,
  affinity_streak_days: 12,
  unlocked_expressions: ['normal', 'smile', 'gentle_smile', 'teasing', 'thinking', 'sad', 'serious', 'embarrassed'],
  unlocked_motions: ['idle', 'nod', 'tilt_head', 'lean_forward', 'close_eyes', 'small_wave'],
  total_items_owned: 3,
  total_items_pool: 5,
  last_interaction_at: null,
  source: 'mock',
  db_ready: false,
  note: 'mock fallback',
}

const PAGE_BG = '#0e0d0b'
const CARD_BG = '#181612'
const TEXT_MAIN = '#ddd5c5'
const TEXT_SUB = '#a39c8c'
const TEXT_DIM = '#7a7468'

export default function CharacterPage() {
  const [state, setState] = useState<CharacterStateResponse>(FALLBACK_STATE)
  const [expression, setExpression] = useState<LunariaExpression>('gentle_smile')
  const [motion, setMotion] = useState<LunariaMotion>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/character/state', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((nextState: CharacterStateResponse) => {
        if (!alive) return
        setState(nextState)
        if (EXPRESSIONS.includes(nextState.current_expression as LunariaExpression)) {
          setExpression(nextState.current_expression as LunariaExpression)
        }
        if (MOTIONS.includes(nextState.current_motion as LunariaMotion)) {
          setMotion(nextState.current_motion as LunariaMotion)
        }
      })
      .catch(error => {
        if (!alive) return
        setState({ ...FALLBACK_STATE, note: `mock fallback: ${error.message}` })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const affinityStage = useMemo(() => {
    if (state.affinity_level >= 80) return 'Co-conspirator'
    if (state.affinity_level >= 60) return 'Close'
    if (state.affinity_level >= 40) return 'Friend'
    if (state.affinity_level >= 20) return 'Familiar'
    return 'First Meeting'
  }, [state.affinity_level])

  const expressionOptions = EXPRESSIONS.filter(item => state.unlocked_expressions.includes(item))
  const motionOptions = MOTIONS.filter(item => state.unlocked_motions.includes(item))
  const itemProgress = state.total_items_pool > 0 ? Math.round((state.total_items_owned / state.total_items_pool) * 100) : 0

  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG, color: TEXT_MAIN, padding: '40px 20px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <Link href="/" style={navLinkStyle}>Back to Room</Link>
          <Link href="/items" style={navLinkStyle}>Items</Link>
          <Link href="/gacha" style={navLinkStyle}>Moonbox</Link>
        </nav>

        <section style={heroGridStyle}>
          <div style={portraitPanelStyle}>
            <LunariaPortrait expression={expression} motion={motion} outfit={state.current_outfit_id} />
          </div>

          <div style={{ ...panelStyle, minHeight: '100%' }}>
            <p style={{ color: '#B99B6B', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, fontSize: 12 }}>Character State Preview</p>
            <h1 style={{ fontSize: 'clamp(2.1rem, 6vw, 4.5rem)', lineHeight: 0.95, margin: '12px 0 16px' }}>Lunaria State</h1>
            <p style={{ color: TEXT_SUB, lineHeight: 1.8, margin: 0 }}>
              A DB-aware preview for outfits, expression unlocks, motion unlocks, and affinity. It uses the
              character_states table when migration 021 is ready, and stays safe with a mock fallback before then.
            </p>
            <p style={{ color: state.db_ready ? '#8fd19e' : '#d7b56d', margin: '18px 0 0', fontSize: 13 }}>
              {loading ? 'Loading character state...' : state.note}
            </p>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
          <InfoCard label="Affinity" value={`${state.affinity_level}/100`} detail={`${affinityStage} / streak ${state.affinity_streak_days} days`} />
          <InfoCard label="Current Look" value={state.current_outfit_name} detail={state.current_background_name} />
          <InfoCard label="Item Progress" value={`${state.total_items_owned}/${state.total_items_pool}`} detail={`${itemProgress}% unlocked`} />
          <InfoCard label="Source" value={state.source} detail={state.db_ready ? 'DB ready' : 'fallback mode'} />
        </section>

        <section style={{ ...panelStyle, marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 8px' }}>Expression / Motion Preview</h2>
              <p style={{ color: TEXT_SUB, margin: 0, lineHeight: 1.7 }}>
                This keeps the visual layer separate from chat logic. Later, AssistantReply can set expression and motion tags directly.
              </p>
            </div>
            <div style={{ color: TEXT_DIM, fontSize: 13 }}>Profile: {state.character_profile_id}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 20 }}>
            <ControlGroup
              title="Expressions"
              items={expressionOptions}
              active={expression}
              onSelect={value => setExpression(value as LunariaExpression)}
            />
            <ControlGroup
              title="Motions"
              items={motionOptions}
              active={motion}
              onSelect={value => setMotion(value as LunariaMotion)}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={cardStyle}>
      <p style={{ color: TEXT_DIM, margin: '0 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem' }}>{value}</h2>
      <p style={{ color: TEXT_SUB, margin: 0 }}>{detail}</p>
    </article>
  )
}

function ControlGroup({ title, items, active, onSelect }: { title: string; items: string[]; active: string; onSelect: (value: string) => void }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 12px' }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            style={item === active ? activeButtonStyle : buttonStyle}
          >
            {item.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

const navLinkStyle = {
  color: TEXT_MAIN,
  textDecoration: 'none',
  border: '1px solid rgba(214, 178, 108, 0.26)',
  borderRadius: 999,
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.03)',
}

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 0.78fr) minmax(300px, 1fr)',
  gap: 18,
}

const panelStyle = {
  background: `radial-gradient(circle at top left, rgba(214,178,108,0.15), transparent 36%), ${CARD_BG}`,
  border: '1px solid rgba(214, 178, 108, 0.18)',
  borderRadius: 28,
  padding: 'clamp(24px, 5vw, 42px)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
}

const portraitPanelStyle = {
  ...panelStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 480,
}

const cardStyle = {
  background: CARD_BG,
  border: '1px solid rgba(221,213,197,0.12)',
  borderRadius: 22,
  padding: 20,
}

const buttonStyle = {
  border: '1px solid rgba(221,213,197,0.16)',
  borderRadius: 999,
  padding: '9px 13px',
  background: 'rgba(255,255,255,0.03)',
  color: TEXT_SUB,
  cursor: 'pointer',
}

const activeButtonStyle = {
  ...buttonStyle,
  color: '#111',
  background: '#D6B26C',
  borderColor: '#D6B26C',
}
