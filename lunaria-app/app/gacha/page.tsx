'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { LunariaPortrait } from '@/components/lunaria/LunariaPortrait'
import { getGachaDrawCopy, pickDailyBonusCopy, pickNoTicketCopy } from '@/lib/lunaria/gacha-copy'
import { getReactionForContext } from '@/lib/lunaria/reactions'

interface GachaState {
  ticket_count: number
  coin_balance: number
  earned_today: number
  daily_bonus_available: boolean
  pity: GachaPityState | null
}

interface PoolItem {
  id: string
  name: string
  rarity: string
  category: string
  image_url: string | null
  description: string | null
}

interface DrawResult {
  result: PoolItem
  was_duplicate: boolean
  coin_earned: number
  ticket_remaining: number
  coin_balance: number
  production_seed: number
  reaction: string
  pity: GachaPityState | null
}

interface GachaPityState {
  draws_since_urban_legend: number
  threshold: number
  triggered: boolean
}

// レアリティごとの表示色とラベル
const RARITY_META: Record<string, { label: string; color: string; glow: string }> = {
  common_a:     { label: 'コモン',       color: '#9fb1b3', glow: 'rgba(159,177,179,0.4)' },
  common_b:     { label: 'コモン',       color: '#9fb1b3', glow: 'rgba(159,177,179,0.4)' },
  rare_a:       { label: 'レア',         color: '#7fb3d5', glow: 'rgba(127,179,213,0.6)' },
  rare_b:       { label: 'レア',         color: '#7fb3d5', glow: 'rgba(127,179,213,0.6)' },
  epic:         { label: 'エピック',     color: '#c39bd3', glow: 'rgba(195,155,211,0.8)' },
  legendary:    { label: 'レジェンド',   color: '#f7ca18', glow: 'rgba(247,202,24,1)' },
  urban_legend: { label: '都市伝説',     color: '#ff6b6b', glow: 'rgba(255,107,107,1)' },
}

const CATEGORY_GLYPH: Record<string, string> = {
  furniture: '▣',
  small_item: '✧',
  accessory: '◇',
  urban_legend: '☾',
}

const PHASE_COPY: Record<Exclude<Phase, 'idle' | 'result'>, string> = {
  stage1: 'ふたを開けるよ',
  stage2: '月明かりに、かざして…',
  reveal: 'そっと受け取って',
}

const RARITY_NOTE: Record<string, string> = {
  common_a: '日常に置いておきたい、ささやかなもの。',
  common_b: 'いつもの時間に少しだけ光を足すもの。',
  rare_a: '部屋の空気がふっと変わる、ちょっと特別なもの。',
  rare_b: '身につけたくなる、小さな物語つきのもの。',
  epic: 'ルナも少し声を弾ませる、めずらしい贈り物。',
  legendary: '今日は覚えておきたくなる夜かもしれない。',
  urban_legend: '見つけた人だけが知っている、静かな噂。',
}

function moonFullnessCopy(pity: GachaPityState | null): string | null {
  if (!pity) return null
  const remaining = Math.max(pity.threshold - pity.draws_since_urban_legend, 0)
  if (pity.triggered) return '月が満ちた。今日は奥の箱まで手が届いた。'
  if (remaining <= 20) return '奥の棚が、少し明るい。'
  return '月明かりが少しずつ溜まっている。'
}

function itemGlyph(item: PoolItem): string {
  if (item.rarity === 'urban_legend') return '☾'
  return CATEGORY_GLYPH[item.category] ?? '✦'
}

// 演出フェーズ
type Phase = 'idle' | 'stage1' | 'stage2' | 'reveal' | 'result'

export default function GachaPage() {
  const [state, setState] = useState<GachaState | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null)

  // 状態取得
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/gacha/state')
      if (res.ok) setState(await res.json())
    } catch (e) {
      console.warn('[gacha] state fetch failed', e)
    }
  }, [])

  useEffect(() => { refreshState() }, [refreshState])

  // デイリーボーナス受取
  const claimDaily = async () => {
    const res = await fetch('/api/gacha/daily', { method: 'POST' })
    if (res.ok) {
      await refreshState()
      setNoticeMsg(pickDailyBonusCopy())
      setTimeout(() => setNoticeMsg(null), 2400)
    }
  }

  // ガチャ実行
  const doDraw = async () => {
    if (drawing) return
    if (!state || state.ticket_count < 1) {
      setNoticeMsg(pickNoTicketCopy())
      setTimeout(() => setNoticeMsg(null), 2400)
      return
    }
    setDrawing(true)
    setErrorMsg(null)
    setNoticeMsg(null)

    const data: DrawResult | { error: string } = await fetch('/api/gacha/draw', { method: 'POST' }).then(r => r.json())
    if ('error' in data) {
      if (data.error === 'no_ticket') {
        setNoticeMsg(pickNoTicketCopy())
        setTimeout(() => setNoticeMsg(null), 2400)
      } else {
        setErrorMsg('エラーだ…')
      }
      setPhase('idle')
      setDrawing(false)
      return
    }

    setDrawResult(data)
    setPhase('stage1')
    await new Promise(r => setTimeout(r, 1500))
    setPhase('stage2')
    await new Promise(r => setTimeout(r, 1500))
    setPhase('reveal')
    await new Promise(r => setTimeout(r, 600))
    setPhase('result')
    setDrawing(false)

    // 状態更新（API が返した値で上書き）
    setState(s => s ? {
      ...s,
      ticket_count: data.ticket_remaining,
      coin_balance: data.coin_balance,
      pity: data.pity ?? s.pity,
    } : s)
  }

  const closeResult = () => {
    setPhase('idle')
    setDrawResult(null)
  }

  const meta = drawResult ? RARITY_META[drawResult.result.rarity] : RARITY_META.common_a
  const drawCopy = drawResult
    ? getGachaDrawCopy(drawResult.production_seed, drawResult.result.rarity)
    : null
  const resultPortraitReaction = drawResult?.result.rarity === 'epic'
    || drawResult?.result.rarity === 'legendary'
    || drawResult?.result.rarity === 'urban_legend'
    ? getReactionForContext('gacha_high_rarity')
    : getReactionForContext('gacha_result')

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      padding: '20px', maxWidth: '480px', margin: '0 auto',
      background: 'radial-gradient(circle at 50% 10%, rgba(127,179,213,0.08), transparent 38%)',
    }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>← 戻る</Link>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 'normal', color: '#ddd5c5' }}>
          月箱
        </h1>
        <Link href="/gacha/inventory" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
          所持品 →
        </Link>
      </div>

      {/* 状態表示 */}
      {state && (
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '16px',
          marginBottom: '12px', display: 'flex', justifyContent: 'space-around',
          boxShadow: '0 18px 50px rgba(0,0,0,0.22)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888' }}>チケット</div>
            <div style={{ fontSize: '24px', color: '#ddd5c5' }}>{state.ticket_count}<span style={{ fontSize: '12px', color: '#666' }}>/50</span></div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888' }}>コイン</div>
            <div style={{ fontSize: '24px', color: '#ddd5c5' }}>{state.coin_balance}</div>
          </div>
        </div>
      )}

      {state?.pity && (
        <div style={{
          background: 'rgba(127,179,213,0.045)',
          border: '1px solid rgba(127,179,213,0.14)',
          borderRadius: 14,
          padding: '10px 12px',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8ca7b8', fontSize: 11, marginBottom: 8 }}>
            <span>月が満ちるまで</span>
            <span>{state.pity.draws_since_urban_legend}/{state.pity.threshold}</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              width: `${Math.min((state.pity.draws_since_urban_legend / state.pity.threshold) * 100, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, rgba(127,179,213,0.45), rgba(221,213,197,0.8))',
              borderRadius: 999,
            }} />
          </div>
          <div style={{ color: '#7a7060', fontSize: 11, textAlign: 'center' }}>
            {moonFullnessCopy(state.pity)}
          </div>
        </div>
      )}

      <div style={{
        color: '#7a7060', fontSize: 12, lineHeight: 1.7,
        textAlign: 'center', marginBottom: '18px',
      }}>
        ルナがときどき持ってくる、ちいさな月箱。思い出とは混ぜず、ここだけでそっと楽しむ。
      </div>

      {/* デイリーボーナス */}
      {state?.daily_bonus_available && (
        <button
          onClick={claimDaily}
          style={{
            background: 'linear-gradient(180deg, #2d3a44 0%, #1f2930 100%)',
            color: '#ddd5c5', border: '1px solid rgba(127,179,213,0.3)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '16px',
          }}
        >
          今日の月箱チケットを受け取る
        </button>
      )}

      {/* メインボタン */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={doDraw}
          disabled={drawing || !state}
          style={{
            width: '180px', height: '180px', borderRadius: '50%',
            background: drawing
              ? '#1a1a1a'
              : 'radial-gradient(circle at 30% 28%, rgba(127,179,213,0.42) 0%, #202b30 34%, #11100e 72%)',
            color: '#ddd5c5', border: '1px solid rgba(221,213,197,0.18)',
            fontSize: '20px', cursor: drawing || !state ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
            opacity: drawing || !state ? 0.4 : ((state.ticket_count ?? 0) < 1 ? 0.35 : 1),
            boxShadow: drawing ? 'none' : '0 0 42px rgba(127,179,213,0.18), inset 0 0 32px rgba(255,255,255,0.04)',
          }}
          onMouseDown={e => { if (!drawing) e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {drawing ? '…' : !state ? '読み込み中' : state.ticket_count < 1 ? 'またあとで' : '受け取る'}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          textAlign: 'center', color: '#ff8888', fontSize: '13px', marginBottom: '12px',
        }}>{errorMsg}</div>
      )}
      {noticeMsg && (
        <div style={{
          textAlign: 'center', color: '#ddd5c5', fontSize: '13px', marginBottom: '12px',
        }}>{noticeMsg}</div>
      )}

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginBottom: '8px' }}>
        会話から届いたチケット {state?.earned_today ?? 0}/5
      </div>

      {/* 演出オーバーレイ */}
      {phase !== 'idle' && phase !== 'result' && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          {phase === 'stage1' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60vw', maxWidth: '300px', aspectRatio: '1',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`,
                animation: 'orbPulse 1.5s ease-in-out',
              }} />
              <div style={{ color: '#7a7060', fontSize: 13, marginTop: 22, letterSpacing: '.06em' }}>
                {drawCopy?.stage1 ?? PHASE_COPY.stage1}
              </div>
            </div>
          )}
          {phase === 'stage2' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '60px', color: meta.color,
                textShadow: `0 0 30px ${meta.glow}, 0 0 60px ${meta.glow}`,
                animation: 'fadeUp 0.6s ease-out',
              }}>
                ✦
              </div>
              <div style={{ color: '#7a7060', fontSize: 13, marginTop: 18, letterSpacing: '.06em' }}>
                {drawCopy?.stage2 ?? PHASE_COPY.stage2}
              </div>
            </div>
          )}
          {phase === 'reveal' && (
            <div style={{ textAlign: 'center', animation: 'fadeUp 0.6s ease-out' }}>
              <div style={{
                fontSize: '24px', color: meta.color,
                textShadow: `0 0 20px ${meta.glow}`,
                marginBottom: 10,
              }}>
                {meta.label}
              </div>
              <div style={{ color: '#7a7060', fontSize: 13, letterSpacing: '.06em' }}>
                {drawCopy?.reveal ?? PHASE_COPY.reveal}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 結果モーダル */}
      {phase === 'result' && drawResult && (
        <div
          onClick={closeResult}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a', borderRadius: '16px', padding: '32px 24px',
              maxWidth: '320px', width: '100%', textAlign: 'center',
              border: `2px solid ${meta.color}`,
              boxShadow: `0 0 40px ${meta.glow}`,
              animation: 'fadeUp 0.5s ease-out',
            }}
          >
            <div style={{
              fontSize: '12px', color: meta.color, letterSpacing: '0.2em',
              marginBottom: '16px',
            }}>
              LUNA'S SMALL GIFT / {drawCopy?.heading ?? meta.label}
            </div>
            <LunariaPortrait
              reaction={resultPortraitReaction}
              size={132}
              label="Luna presenting the moon box result"
              style={{ margin: '0 auto 16px' }}
            />
            <div style={{
              width: '120px', height: '120px', margin: '0 auto 16px',
              background: `radial-gradient(circle at 50% 35%, ${meta.glow}, rgba(255,255,255,0.04) 62%)`,
              border: `1px solid ${meta.color}55`,
              borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '48px',
            }}>
              <span aria-hidden="true" style={{ color: meta.color, textShadow: `0 0 22px ${meta.glow}` }}>
                {itemGlyph(drawResult.result)}
              </span>
            </div>
            <div style={{ fontSize: '18px', color: '#ddd5c5', marginBottom: '8px' }}>
              {drawResult.result.name}
            </div>
            {drawResult.result.description && (
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                {drawResult.result.description}
              </div>
            )}
            <div style={{
              fontSize: '12px',
              color: '#7a7060',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}>
              {RARITY_NOTE[drawResult.result.rarity] ?? 'ルナが選んだ、今日だけの小さなもの。'}
            </div>
            {drawResult.was_duplicate && (
              <div style={{
                fontSize: '13px', color: '#f7ca18',
                background: 'rgba(247,202,24,0.1)', borderRadius: '6px',
                padding: '8px', marginBottom: '12px',
              }}>
                かぶり！ コイン +{drawResult.coin_earned}
              </div>
            )}
            {drawResult.pity?.triggered && (
              <div style={{
                fontSize: '13px',
                color: '#ddd5c5',
                background: 'rgba(127,179,213,0.08)',
                border: '1px solid rgba(127,179,213,0.2)',
                borderRadius: '8px',
                padding: '9px',
                marginBottom: '12px',
              }}>
                月が満ちた。今日は奥の箱まで手が届いた。
              </div>
            )}
            {/* ルナのリアクション（取得直後のみの受け取り演出。会話履歴には残らない） */}
            {drawResult.reaction && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'rgba(127,179,213,0.06)',
                border: '1px solid rgba(127,179,213,0.2)',
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: '16px',
                textAlign: 'left',
              }}>
                <div className="orb-anim" style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#7fb3d5', flexShrink: 0, marginTop: 6,
                }} />
                <div style={{ fontSize: 13, color: '#ddd5c5', lineHeight: 1.5 }}>
                  {drawResult.reaction}
                </div>
              </div>
            )}
            <button
              onClick={closeResult}
              style={{
                background: 'transparent', color: '#ddd5c5',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                padding: '10px 24px', cursor: 'pointer', fontSize: '14px',
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
