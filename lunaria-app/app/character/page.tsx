'use client'

/**
 * /character
 *
 * 現在のルナリア状態を mock 表示する。DB 接続なし。
 *
 * TODO（Codex 復帰後）：
 *   - `/api/character/state` を実装し、`character_states` から取得
 *   - 表情 / モーションの slider を AssistantReply driven に
 *   - 装備変更ボタンを `/items` の装備アクションと連動
 *   - 親密度の段階表示（数値非表示）
 */

import Link from 'next/link'
import { useState } from 'react'
import LunariaPortrait, {
  type LunariaExpression,
  type LunariaMotion,
} from '@/components/character/LunariaPortrait'

const EXPRESSIONS: LunariaExpression[] = [
  'normal',
  'smile',
  'gentle_smile',
  'teasing',
  'surprised',
  'thinking',
  'sad',
  'serious',
  'embarrassed',
  'sleepy',
  'excited',
  'relieved',
]

const MOTIONS: LunariaMotion[] = [
  'idle',
  'tilt_head',
  'nod',
  'shake_head',
  'look_away',
  'lean_forward',
  'close_eyes',
  'small_wave',
  'arms_crossed',
  'soft_laugh',
]

// mock state
const MOCK_STATE = {
  current_outfit: { id: 'outfit_winter_coat', name: '月白のコート' },
  current_background: { id: 'bg_window_night', name: '窓辺の夜' },
  current_diary_skin: null as null | { id: string; name: string },
  equipped_accessories: [
    { id: 'acc_moon_pin', name: '三日月のヘアピン' },
    { id: 'acc_ribbon_navy', name: '紺のリボン' },
  ],
  affinity_level: 47, // 内部値、UI には段階で表示
  affinity_streak_days: 12,
  total_items_owned: 9,
  total_items_pool: 30,
  unlocked_expressions: ['normal', 'smile', 'gentle_smile', 'teasing', 'thinking', 'sad', 'serious', 'embarrassed'] as string[],
  unlocked_motions: ['idle', 'nod', 'tilt_head', 'lean_forward', 'close_eyes', 'small_wave'] as string[],
  last_interaction_at: '2026-05-04T22:13:00+09:00',
}

const PAGE_BG = '#0e0d0b'
const CARD_BG = '#181612'
const TEXT_MAIN = '#ddd5c5'
const TEXT_SUB = '#a39c8c'
const TEXT_DIM = '#7a7468'

function affinityStage(level: number): { label: string; index: number } {
  if (level < 20) return { label: '初対面', index: 0 }
  if (level < 40) return { label: '顔見知り', index: 1 }
  if (level < 60) return { label: '友達', index: 2 }
  if (level < 80) return { label: '親しい', index: 3 }
  return { label: '共犯者', index: 4 }
}

export default function CharacterPage() {
  const [expression, setExpression] = useState<LunariaExpression>('gentle_smile')
  const [motion, setMotion] = useState<LunariaMotion>('idle')

  const stage = affinityStage(MOCK_STATE.affinity_level)
  const stageList = ['初対面', '顔見知り', '友達', '親しい', '共犯者']

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, color: TEXT_MAIN, padding: 24, overflow: 'auto', height: '100dvh' }}>
      <header style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>← ルナの部屋へ</Link>
        <Link href="/diary" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>日記へ</Link>
        <Link href="/memory" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>記憶へ</Link>
        <Link href="/items" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>アイテムへ</Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 24 }}>
        {/* 左：立ち絵 */}
        <section style={{ background: CARD_BG, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 400, letterSpacing: 1, color: TEXT_MAIN }}>ルナの今日</h1>
          <LunariaPortrait expression={expression} motion={motion} outfit={MOCK_STATE.current_outfit.id} size="lg" />
          <p style={{ color: TEXT_SUB, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            {MOCK_STATE.current_outfit.name}<br />
            <span style={{ color: TEXT_DIM, fontSize: 11 }}>{MOCK_STATE.current_background.name} で</span>
          </p>
        </section>

        {/* 右：状態カード群 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="親密度">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 18, color: TEXT_MAIN }}>{stage.label}</span>
              <span style={{ fontSize: 11, color: TEXT_DIM }}>連続 {MOCK_STATE.affinity_streak_days} 日</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {stageList.map((s, i) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: i <= stage.index ? '#D6B26C' : '#2a2620',
                  }}
                />
              ))}
            </div>
            <p style={{ color: TEXT_DIM, fontSize: 11, marginTop: 8 }}>会話と日記で、ちょっとずつ。ガチャでは増えない。</p>
          </Card>

          <Card title="装備中">
            <Row label="衣装" value={MOCK_STATE.current_outfit.name} />
            <Row label="背景" value={MOCK_STATE.current_background.name} />
            <Row label="日記スキン" value={MOCK_STATE.current_diary_skin?.name ?? '—'} />
            <Row label="アクセサリー" value={MOCK_STATE.equipped_accessories.map(a => a.name).join(' / ') || '—'} />
            <p style={{ color: TEXT_DIM, fontSize: 11, marginTop: 8 }}>装備変更は <Link href="/items" style={{ color: TEXT_SUB }}>アイテム棚</Link> から（実装は Codex 復帰後）</p>
          </Card>

          <Card title="表情・モーション（プレビュー）">
            <p style={{ color: TEXT_DIM, fontSize: 11, marginBottom: 8 }}>
              選んで、左の立ち絵がどう変わるか見てみる。<br />
              実運用では AI 返答（AssistantReply.expression / motion）から自動で変わる。
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {EXPRESSIONS.map(e => {
                const unlocked = MOCK_STATE.unlocked_expressions.includes(e)
                const active = e === expression
                return (
                  <button
                    key={e}
                    onClick={() => unlocked && setExpression(e)}
                    disabled={!unlocked}
                    title={unlocked ? '' : '未解放'}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: active ? '#2a2620' : 'transparent',
                      color: active ? TEXT_MAIN : unlocked ? TEXT_SUB : TEXT_DIM,
                      border: `1px solid ${active ? TEXT_SUB : TEXT_DIM}`,
                      borderRadius: 999,
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MOTIONS.map(m => {
                const unlocked = MOCK_STATE.unlocked_motions.includes(m)
                const active = m === motion
                return (
                  <button
                    key={m}
                    onClick={() => unlocked && setMotion(m)}
                    disabled={!unlocked}
                    title={unlocked ? '' : '未解放'}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: active ? '#2a2620' : 'transparent',
                      color: active ? TEXT_MAIN : unlocked ? TEXT_SUB : TEXT_DIM,
                      border: `1px solid ${active ? TEXT_SUB : TEXT_DIM}`,
                      borderRadius: 999,
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card title="持ち物">
            <Row label="所持アイテム" value={`${MOCK_STATE.total_items_owned} / ${MOCK_STATE.total_items_pool}`} />
            <Row label="解放済み表情" value={`${MOCK_STATE.unlocked_expressions.length} / 12`} />
            <Row label="解放済みモーション" value={`${MOCK_STATE.unlocked_motions.length} / 10`} />
          </Card>

          <Card title="さいきん">
            <Row label="最後の会話" value={new Date(MOCK_STATE.last_interaction_at).toLocaleString('ja-JP')} />
          </Card>
        </section>
      </div>

      <p style={{ color: TEXT_DIM, fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
        ※ これは mock 表示です。Codex 復帰後に <code>character_states</code> + <code>user_items</code> から取得するように切り替えます。
      </p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, borderRadius: 12, padding: 16 }}>
      <h2 style={{ fontSize: 12, color: TEXT_SUB, marginBottom: 10, letterSpacing: 1 }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 13, color: TEXT_MAIN }}>
      <span style={{ color: TEXT_SUB, fontSize: 12 }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
