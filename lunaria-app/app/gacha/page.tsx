'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface GachaState {
  ticket_count: number
  coin_balance: number
  earned_today: number
  daily_bonus_available: boolean
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
    }
  }

  // ガチャ実行
  const doDraw = async () => {
    if (drawing) return
    if (!state || state.ticket_count < 1) {
      setErrorMsg('チケットが足りないよ')
      setTimeout(() => setErrorMsg(null), 2000)
      return
    }
    setDrawing(true)
    setErrorMsg(null)

    // 並行：演出開始 + API 呼び出し
    setPhase('stage1')
    const apiPromise = fetch('/api/gacha/draw', { method: 'POST' }).then(r => r.json())

    // 演出 stage1: 1.5 秒
    await new Promise(r => setTimeout(r, 1500))
    setPhase('stage2')

    // 演出 stage2: 1.5 秒
    await new Promise(r => setTimeout(r, 1500))

    const data: DrawResult | { error: string } = await apiPromise
    if ('error' in data) {
      setErrorMsg(data.error === 'no_ticket' ? 'チケットが足りないよ' : 'エラーだ…')
      setPhase('idle')
      setDrawing(false)
      return
    }

    setDrawResult(data)
    setPhase('reveal')
    await new Promise(r => setTimeout(r, 600))
    setPhase('result')
    setDrawing(false)

    // 状態更新（API が返した値で上書き）
    setState(s => s ? {
      ...s,
      ticket_count: data.ticket_remaining,
      coin_balance: data.coin_balance,
    } : s)
  }

  const closeResult = () => {
    setPhase('idle')
    setDrawResult(null)
  }

  const meta = drawResult ? RARITY_META[drawResult.result.rarity] : RARITY_META.common_a

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
          ガチャ
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

      <div style={{
        color: '#7a7060', fontSize: 12, lineHeight: 1.7,
        textAlign: 'center', marginBottom: '18px',
      }}>
        会話のついでに集まる、ちいさなおみやげ。結果は思い出を汚さず、ここだけでそっと楽しむ。
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
          ✨ デイリーボーナス（チケット +1）
        </button>
      )}

      {/* メインボタン */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={doDraw}
          disabled={drawing || (state?.ticket_count ?? 0) < 1}
          style={{
            width: '180px', height: '180px', borderRadius: '50%',
            background: drawing
              ? '#1a1a1a'
              : 'radial-gradient(circle at 30% 28%, rgba(127,179,213,0.42) 0%, #202b30 34%, #11100e 72%)',
            color: '#ddd5c5', border: '1px solid rgba(221,213,197,0.18)',
            fontSize: '20px', cursor: drawing ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
            opacity: drawing ? 0.4 : ((state?.ticket_count ?? 0) < 1 ? 0.35 : 1),
            boxShadow: drawing ? 'none' : '0 0 42px rgba(127,179,213,0.18), inset 0 0 32px rgba(255,255,255,0.04)',
          }}
          onMouseDown={e => { if (!drawing) e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {drawing ? '…' : (state?.ticket_count ?? 0) < 1 ? 'おやすみ' : '引く'}
        </button>
      </div>

      {errorMsg && (
        <div style={{
          textAlign: 'center', color: '#ff8888', fontSize: '13px', marginBottom: '12px',
        }}>{errorMsg}</div>
      )}

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginBottom: '8px' }}>
        本日の獲得チケット {state?.earned_today ?? 0}/5
      </div>

      {/* 演出オーバーレイ */}
      {phase !== 'idle' && phase !== 'result' && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          {phase === 'stage1' && (
            <div style={{
              width: '60vw', maxWidth: '300px', aspectRatio: '1',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`,
              animation: 'orbPulse 1.5s ease-in-out',
            }} />
          )}
          {phase === 'stage2' && (
            <div style={{
              fontSize: '60px', color: meta.color,
              textShadow: `0 0 30px ${meta.glow}, 0 0 60px ${meta.glow}`,
              animation: 'fadeUp 0.6s ease-out',
            }}>
              ✦
            </div>
          )}
          {phase === 'reveal' && (
            <div style={{
              fontSize: '24px', color: meta.color,
              textShadow: `0 0 20px ${meta.glow}`,
              animation: 'fadeUp 0.6s ease-out',
            }}>
              {meta.label}
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
              {meta.label}
            </div>
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
            {drawResult.was_duplicate && (
              <div style={{
                fontSize: '13px', color: '#f7ca18',
                background: 'rgba(247,202,24,0.1)', borderRadius: '6px',
                padding: '8px', marginBottom: '12px',
              }}>
                かぶり！ コイン +{drawResult.coin_earned}
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
