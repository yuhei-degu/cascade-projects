'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ApiErrorState, { DEFAULT_API_ERROR_MESSAGE } from '@/components/ApiErrorState'
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
  current_outfit_name: '月明かりの制服',
  current_background_id: 'bg_window_night',
  current_background_name: '夜の窓辺',
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
  note: '代替データ',
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

const SOURCE_LABELS: Record<CharacterStateResponse['source'], string> = {
  character_states: '姿状態DB',
  mock: '代替データ',
}

const PAGE_BG = 'var(--luna-bg)'
const CARD_BG = 'var(--luna-surface-raised)'
const TEXT_MAIN = 'var(--luna-text)'
const TEXT_SUB = 'var(--luna-text-soft)'
const TEXT_DIM = 'var(--luna-faint)'

export default function CharacterPage() {
  const [state, setState] = useState<CharacterStateResponse>(FALLBACK_STATE)
  const [expression, setExpression] = useState<LunariaExpression>('gentle_smile')
  const [motion, setMotion] = useState<LunariaMotion>('idle')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCharacterState = useCallback(() => {
    let alive = true
    setLoading(true)
    setError(null)
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
      .catch(() => {
        if (!alive) return
        setState({ ...FALLBACK_STATE, note: '通信に失敗したため、代替データを表示しています。' })
        setError(DEFAULT_API_ERROR_MESSAGE)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => loadCharacterState(), [loadCharacterState])

  const affinityStage = useMemo(() => {
    if (state.affinity_level >= 80) return '共犯者'
    if (state.affinity_level >= 60) return '近しい相手'
    if (state.affinity_level >= 40) return '友だち'
    if (state.affinity_level >= 20) return '顔なじみ'
    return '初対面'
  }, [state.affinity_level])

  const expressionOptions = EXPRESSIONS.filter(item => state.unlocked_expressions.includes(item))
  const motionOptions = MOTIONS.filter(item => state.unlocked_motions.includes(item))
  const itemProgress = state.total_items_pool > 0 ? Math.round((state.total_items_owned / state.total_items_pool) * 100) : 0

  return (
    <main style={{
      minHeight: '100vh',
      overflowY: 'auto',
      background: 'radial-gradient(circle at 18% 8%, rgba(241,199,127,.15), transparent 34%), radial-gradient(circle at 84% 14%, rgba(127,179,213,.08), transparent 28%), linear-gradient(180deg, var(--luna-bg), var(--luna-bg-soft))',
      color: TEXT_MAIN,
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <nav aria-label="姿のナビゲーション" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <Link href="/" aria-label="Lunariaの部屋に戻る" style={navLinkStyle}>部屋に戻る</Link>
          <Link href="/items" aria-label="品を開く" style={navLinkStyle}>品</Link>
          <Link href="/gacha" aria-label="ガチャを開く" style={navLinkStyle}>月箱</Link>
        </nav>

        <section style={heroGridStyle}>
          <div style={portraitPanelStyle}>
            {loading ? (
              <div aria-label="姿を読み込み中" style={{ width: 'min(100%, 360px)', display: 'grid', gap: 14 }}>
                <div className="luna-skeleton" style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: 18 }} />
                <div className="luna-skeleton luna-skeleton-line" style={{ width: '62%', margin: '0 auto' }} />
              </div>
            ) : (
              <LunariaPortrait expression={expression} motion={motion} outfit={state.current_outfit_id} />
            )}
          </div>

          <div style={{ ...panelStyle, minHeight: '100%' }}>
            <p style={{ color: '#B99B6B', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, fontSize: 12 }}>姿の状態プレビュー</p>
            <h1 style={{ fontSize: 'clamp(2.1rem, 6vw, 4.5rem)', lineHeight: 0.95, margin: '12px 0 16px' }}>Lunariaの状態</h1>
            <p style={{ color: TEXT_SUB, lineHeight: 1.8, margin: 0 }}>
              衣装、表情解放、動きの解放、親密度を確認するプレビューです。migration 021が準備できている場合は
              姿状態テーブルを使い、それまでは安全な代替データで表示します。
            </p>
            <SourceBanner
              ready={state.db_ready}
              loading={loading}
              title={state.db_ready ? 'DBの姿状態が有効です' : '代替の姿状態が有効です'}
              note={loading ? '姿の状態を読み込んでいます...' : state.note}
              detail={
                state.db_ready
                  ? 'このプレビューは永続化された姿状態レイヤーを反映しています。'
                  : '安全なプレビューモードです。migration 021が適用されるまで、表情と動きの操作はこの画面内だけに反映されます。'
              }
            />
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
          <InfoCard label="親密度" value={`${state.affinity_level}/100`} detail={`${affinityStage} / 連続 ${state.affinity_streak_days}日`} />
          <InfoCard label="現在の装い" value={state.current_outfit_name} detail={state.current_background_name} />
          <InfoCard label="品の進捗" value={`${state.total_items_owned}/${state.total_items_pool}`} detail={`${itemProgress}% 解放済み`} />
          <InfoCard label="取得元" value={SOURCE_LABELS[state.source]} detail={state.db_ready ? 'DB準備済み' : '代替モード'} />
        </section>

        {error && <ApiErrorState message={error} onRetry={loadCharacterState} style={{ marginTop: 18 }} />}

        <section style={{ ...panelStyle, marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 8px' }}>表情・動きプレビュー</h2>
              <p style={{ color: TEXT_SUB, margin: 0, lineHeight: 1.7 }}>
                表示レイヤーをチャット処理から分けて確認できます。将来的にはAssistantReplyが表情と動きのタグを直接設定できます。
              </p>
            </div>
            <div style={{ color: TEXT_DIM, fontSize: 13 }}>プロフィール: {state.character_profile_id}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginTop: 20 }}>
            <ControlGroup
              title="表情"
              items={expressionOptions}
              active={expression}
              labels={EXPRESSION_LABELS}
              onSelect={value => setExpression(value as LunariaExpression)}
            />
            <ControlGroup
              title="動き"
              items={motionOptions}
              active={motion}
              labels={MOTION_LABELS}
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

function SourceBanner({ ready, loading, title, note, detail }: { ready: boolean; loading: boolean; title: string; note: string; detail: string }) {
  return (
    <div style={{
      marginTop: 18,
      border: `1px solid ${ready ? 'rgba(143,209,158,0.28)' : 'rgba(215,181,109,0.3)'}`,
      borderRadius: 18,
      padding: '12px 14px',
      background: ready ? 'rgba(143,209,158,0.08)' : 'rgba(215,181,109,0.08)',
    }}>
      <div style={{ color: ready ? '#8fd19e' : '#d7b56d', fontSize: 13, fontWeight: 700 }}>
        {loading ? '姿の取得元を確認しています...' : title}
      </div>
      <div style={{ color: TEXT_SUB, fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>{note}</div>
      <div style={{ color: TEXT_DIM, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{detail}</div>
    </div>
  )
}

function ControlGroup({ title, items, active, labels, onSelect }: { title: string; items: string[]; active: string; labels: Record<string, string>; onSelect: (value: string) => void }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 12px' }}>{title}</h3>
      {items.length === 0 ? (
        <div className="luna-empty" style={{ padding: 18 }}>
          <span className="luna-empty-icon" aria-hidden="true">◇</span>
          <strong className="luna-empty-title">{title}はまだ解放されていません。</strong>
          <p className="luna-empty-copy">会話や月箱で条件を満たすと、ここに選べる項目が増えていきます。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            style={item === active ? activeButtonStyle : buttonStyle}
          >
            {labels[item] ?? item}
          </button>
          ))}
        </div>
      )}
    </div>
  )
}

const navLinkStyle = {
  color: 'var(--luna-gold)',
  textDecoration: 'none',
  border: '1px solid var(--luna-border)',
  borderRadius: 999,
  padding: '10px 14px',
  background: 'rgba(241,199,127,.065)',
}

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 18,
}

const panelStyle = {
  background: `radial-gradient(circle at top left, rgba(241,199,127,.15), transparent 36%), ${CARD_BG}`,
  border: '1px solid var(--luna-border)',
  borderRadius: 18,
  padding: 'clamp(24px, 5vw, 42px)',
  boxShadow: 'var(--luna-shadow)',
}

const portraitPanelStyle = {
  ...panelStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 480,
}

const cardStyle = {
  background: 'linear-gradient(145deg, rgba(27,23,17,.9), rgba(14,13,11,.96))',
  border: '1px solid var(--luna-border)',
  borderRadius: 18,
  padding: 20,
  boxShadow: 'var(--luna-shadow)',
}

const buttonStyle = {
  border: '1px solid var(--luna-border)',
  borderRadius: 999,
  padding: '9px 13px',
  background: 'rgba(241,199,127,.055)',
  color: TEXT_SUB,
  cursor: 'pointer',
}

const activeButtonStyle = {
  ...buttonStyle,
  color: '#100d09',
  background: 'var(--luna-gold)',
  borderColor: 'rgba(241,199,127,.52)',
}
