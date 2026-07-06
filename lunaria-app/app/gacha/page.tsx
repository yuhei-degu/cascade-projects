'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { LunariaPortrait } from '@/components/lunaria/LunariaPortrait'
import { getGachaDrawCopy, pickDailyBonusCopy, pickNoTicketCopy } from '@/lib/lunaria/gacha-copy'
import { getReactionForContext } from '@/lib/lunaria/reactions'

type Rarity = 'common_a' | 'common_b' | 'rare_a' | 'rare_b' | 'epic' | 'legendary' | 'urban_legend'
type Category = 'furniture' | 'small_item' | 'accessory' | 'urban_legend'
type Phase = 'idle' | 'charge' | 'flash' | 'flip' | 'result'
type ViewMode = 'draw' | 'collection'

interface GachaPityState {
  draws_since_urban_legend: number
  threshold: number
  triggered: boolean
}

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
  rarity: Rarity
  category: Category
  image_url: string | null
  description: string | null
}

interface InventoryItem extends PoolItem {
  acquired_at: string
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

const RARITY_META: Record<Rarity, { label: string; short: string; color: string; glow: string; flash: string }> = {
  common_a: { label: 'N', short: 'N', color: '#f2f3f0', glow: 'rgba(242,243,240,0.55)', flash: '#ffffff' },
  common_b: { label: 'N', short: 'N', color: '#f2f3f0', glow: 'rgba(242,243,240,0.55)', flash: '#ffffff' },
  rare_a: { label: 'R', short: 'R', color: '#62a8ff', glow: 'rgba(98,168,255,0.65)', flash: '#4ba0ff' },
  rare_b: { label: 'R', short: 'R', color: '#62a8ff', glow: 'rgba(98,168,255,0.65)', flash: '#4ba0ff' },
  epic: { label: 'SR', short: 'SR', color: '#f4c542', glow: 'rgba(244,197,66,0.78)', flash: '#ffd84d' },
  legendary: { label: 'SSR', short: 'SSR', color: '#ff8f52', glow: 'rgba(255,143,82,0.82)', flash: '#ffb15f' },
  urban_legend: { label: 'UR', short: 'UR', color: '#ff5f86', glow: 'rgba(255,95,134,0.88)', flash: '#ff4f8f' },
}

const CATEGORY_LABEL: Record<Category, string> = {
  furniture: '家具',
  small_item: '小物',
  accessory: 'アクセサリ',
  urban_legend: '都市伝説',
}

const CATEGORY_GLYPH: Record<Category, string> = {
  furniture: '◇',
  small_item: '✦',
  accessory: '○',
  urban_legend: '☾',
}

const RARITY_NOTE: Record<Rarity, string> = {
  common_a: '静かな部屋にすっとなじむ、やさしい一品。',
  common_b: '身につけたり眺めたりしたくなる、小さな収集品。',
  rare_a: '空気が少し変わる、印象的なアイテム。',
  rare_b: '光を拾ってきらりと残る、特別なアクセサリ。',
  epic: '棚に並べたくなる、存在感のある逸品。',
  legendary: '今日の月箱にだけ訪れた、まばゆい宝物。',
  urban_legend: '見つけた人だけが知る、ひそかな伝説。',
}

function itemGlyph(item: Pick<PoolItem, 'rarity' | 'category'>): string {
  if (item.rarity === 'urban_legend') return CATEGORY_GLYPH.urban_legend
  return CATEGORY_GLYPH[item.category] ?? '✦'
}

function moonFullnessCopy(pity: GachaPityState | null): string | null {
  if (!pity) return null
  const remaining = Math.max(pity.threshold - pity.draws_since_urban_legend, 0)
  if (pity.triggered) return '月が満ちました。特別な光が箱に届いています。'
  if (remaining <= 20) return '月の光がかなり満ちてきました。'
  return '月の光が少しずつ満ちています。'
}

function sortByRarityAndName(a: PoolItem, b: PoolItem): number {
  const order: Rarity[] = ['urban_legend', 'legendary', 'epic', 'rare_b', 'rare_a', 'common_b', 'common_a']
  return order.indexOf(a.rarity) - order.indexOf(b.rarity) || a.name.localeCompare(b.name, 'ja')
}

function useTimeouts() {
  const timeouts = useRef<number[]>([])
  const clear = useCallback(() => {
    timeouts.current.forEach(window.clearTimeout)
    timeouts.current = []
  }, [])
  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay)
    timeouts.current.push(id)
  }, [])

  useEffect(() => clear, [clear])
  return { clear, schedule }
}

export default function GachaPage() {
  const [state, setState] = useState<GachaState | null>(null)
  const [pool, setPool] = useState<PoolItem[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('draw')
  const [phase, setPhase] = useState<Phase>('idle')
  const [drawing, setDrawing] = useState(false)
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null)
  const skipRequested = useRef(false)
  const { clear, schedule } = useTimeouts()

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/gacha/state')
      if (res.ok) setState(await res.json())
    } catch (e) {
      console.warn('[gacha] state fetch failed', e)
    }
  }, [])

  const refreshCollection = useCallback(async () => {
    try {
      const [poolRes, inventoryRes] = await Promise.all([
        fetch('/api/gacha/pool'),
        fetch('/api/gacha/inventory'),
      ])
      if (poolRes.ok) {
        const data = await poolRes.json()
        setPool((data.items ?? []).sort(sortByRarityAndName))
      }
      if (inventoryRes.ok) {
        const data = await inventoryRes.json()
        setInventory(data.items ?? [])
      }
    } catch (e) {
      console.warn('[gacha] collection fetch failed', e)
    }
  }, [])

  useEffect(() => {
    refreshState()
    refreshCollection()
  }, [refreshState, refreshCollection])

  const ownedIds = useMemo(() => new Set(inventory.map(item => item.id)), [inventory])
  const ownedCount = useMemo(() => pool.filter(item => ownedIds.has(item.id)).length, [pool, ownedIds])
  const collectionRate = pool.length > 0 ? Math.round((ownedCount / pool.length) * 100) : 0
  const activeMeta = drawResult ? RARITY_META[drawResult.result.rarity] : RARITY_META.common_a
  const drawCopy = drawResult ? getGachaDrawCopy(drawResult.production_seed, drawResult.result.rarity) : null
  const resultPortraitReaction = drawResult && ['epic', 'legendary', 'urban_legend'].includes(drawResult.result.rarity)
    ? getReactionForContext('gacha_high_rarity')
    : getReactionForContext('gacha_result')

  const finishAnimation = useCallback(() => {
    clear()
    if (drawResult) {
      setPhase('result')
      setDrawing(false)
    } else {
      skipRequested.current = true
    }
  }, [clear, drawResult])

  const claimDaily = async () => {
    const res = await fetch('/api/gacha/daily', { method: 'POST' })
    if (res.ok) {
      await refreshState()
      setNoticeMsg(pickDailyBonusCopy())
      window.setTimeout(() => setNoticeMsg(null), 2400)
    }
  }

  const doDraw = async () => {
    if (drawing) return
    if (!state || state.ticket_count < 1) {
      setNoticeMsg(pickNoTicketCopy())
      window.setTimeout(() => setNoticeMsg(null), 2400)
      return
    }

    clear()
    setDrawing(true)
    setDrawResult(null)
    skipRequested.current = false
    setErrorMsg(null)
    setNoticeMsg(null)
    setPhase('charge')

    let data: DrawResult | { error: string }
    try {
      data = await fetch('/api/gacha/draw', { method: 'POST' }).then(r => r.json())
    } catch {
      setErrorMsg('抽選に失敗しました。時間をおいてもう一度お試しください。')
      setPhase('idle')
      setDrawing(false)
      return
    }

    if ('error' in data) {
      if (data.error === 'no_ticket') {
        setNoticeMsg(pickNoTicketCopy())
        window.setTimeout(() => setNoticeMsg(null), 2400)
      } else {
        setErrorMsg('抽選に失敗しました。時間をおいてもう一度お試しください。')
      }
      setPhase('idle')
      setDrawing(false)
      return
    }

    setDrawResult(data)
    setState(current => current ? {
      ...current,
      ticket_count: data.ticket_remaining,
      coin_balance: data.coin_balance,
      pity: data.pity ?? current.pity,
    } : current)
    setInventory(current => current.some(item => item.id === data.result.id)
      ? current
      : [{ ...data.result, acquired_at: new Date().toISOString() }, ...current])

    if (skipRequested.current) {
      setPhase('result')
      setDrawing(false)
      return
    }

    schedule(() => setPhase('flash'), 650)
    schedule(() => setPhase('flip'), 1050)
    schedule(() => {
      setPhase('result')
      setDrawing(false)
    }, 1800)
  }

  const closeResult = () => {
    clear()
    skipRequested.current = false
    setPhase('idle')
    setDrawing(false)
    setDrawResult(null)
  }

  return (
    <main className="gacha-shell">
      <nav className="gacha-nav" aria-label="ガチャのナビゲーション">
        <Link href="/" aria-label="Lunariaの部屋に戻る">← ルーム</Link>
        <h1>月箱</h1>
        <Link href="/gacha/inventory" aria-label="ガチャ所持品を開く">所持品</Link>
      </nav>

      <div className="gacha-tabs" role="tablist" aria-label="ガチャの表示切り替え">
        <button type="button" className={viewMode === 'draw' ? 'active' : ''} onClick={() => setViewMode('draw')}>抽選</button>
        <button type="button" className={viewMode === 'collection' ? 'active' : ''} onClick={() => setViewMode('collection')}>図鑑</button>
      </div>

      {viewMode === 'draw' ? (
        <>
          {state && (
            <section className="gacha-status" aria-label="ガチャの所持リソース">
              <div>
                <span>チケット</span>
                <strong>{state.ticket_count}<small>/50</small></strong>
              </div>
              <div aria-hidden="true" className="gacha-divider" />
              <div>
                <span>コイン</span>
                <strong>{state.coin_balance}</strong>
              </div>
            </section>
          )}

          {state?.pity && (
            <section className="moon-meter" aria-label="月光ゲージ">
              <div className="moon-meter-row">
                <span>月光ゲージ</span>
                <span>{state.pity.draws_since_urban_legend}/{state.pity.threshold}</span>
              </div>
              <div className="moon-meter-track">
                <div style={{ width: `${Math.min((state.pity.draws_since_urban_legend / state.pity.threshold) * 100, 100)}%` }} />
              </div>
              <p>{moonFullnessCopy(state.pity)}</p>
            </section>
          )}

          <p className="gacha-lead">月箱を開けて、家具・小物・アクセサリを集めよう。光の色が、手に入るレアリティを告げます。</p>

          {state?.daily_bonus_available && (
            <button type="button" className="daily-button" onClick={claimDaily}>今日のチケットを受け取る</button>
          )}

          <section className="summon-stage" aria-label="Draw stage">
            <button
              type="button"
              className="summon-button"
              onClick={doDraw}
              disabled={drawing || !state}
              aria-busy={drawing}
            >
              <span>{drawing ? '抽選中' : !state ? '読込中' : state.ticket_count < 1 ? 'チケット不足' : '月箱を開ける'}</span>
            </button>
          </section>

          {errorMsg && <p className="gacha-message error">{errorMsg}</p>}
          {noticeMsg && <p className="gacha-message">{noticeMsg}</p>}

          <p className="gacha-quota">本日の獲得チケット {state?.earned_today ?? 0}/5</p>
        </>
      ) : (
        <CollectionView
          pool={pool}
          ownedIds={ownedIds}
          collectionRate={collectionRate}
          ownedCount={ownedCount}
        />
      )}

      {phase !== 'idle' && phase !== 'result' && (
        <button
          type="button"
          className={`gacha-production phase-${phase}`}
          style={{
            '--rarity-color': activeMeta.color,
            '--rarity-glow': activeMeta.glow,
            '--rarity-flash': activeMeta.flash,
          } as CSSProperties}
          onClick={finishAnimation}
          aria-label="ガチャ演出をスキップ"
        >
          <div className="production-core">
            {phase === 'charge' && (
              <>
                <div className="production-orb" />
                <p>{drawCopy?.stage1 ?? '月箱に光が集まる'}</p>
              </>
            )}
            {phase === 'flash' && (
              <>
                <div className="rarity-flash-text">{activeMeta.label}</div>
                <p>{drawCopy?.stage2 ?? '光が弾ける'}</p>
              </>
            )}
            {phase === 'flip' && drawResult && (
              <div className="flip-card-wrap">
                <div className="flip-card">
                  <div className="flip-card-face flip-card-back">月箱</div>
                  <div className="flip-card-face flip-card-front">
                    <span className="result-badge">{activeMeta.label}</span>
                    <strong>{itemGlyph(drawResult.result)}</strong>
                  </div>
                </div>
                <p>{drawCopy?.reveal ?? 'カードが反転する'}</p>
              </div>
            )}
          </div>
          <span className="skip-copy">タップでスキップ</span>
        </button>
      )}

      {phase === 'result' && drawResult && (
        <div className="result-overlay" onClick={closeResult}>
          <section
            className="result-panel"
            style={{
              '--rarity-color': activeMeta.color,
              '--rarity-glow': activeMeta.glow,
            } as CSSProperties}
            onClick={e => e.stopPropagation()}
            aria-label="ガチャ結果"
          >
            <div className="result-heading">
              <span>{activeMeta.label}</span>
              <p>{drawCopy?.heading ?? '新しいコレクション'}</p>
            </div>
            <LunariaPortrait
              reaction={resultPortraitReaction}
              size={124}
              label="ルナが月箱の結果を見せている"
              style={{ margin: '0 auto 14px' }}
            />
            <div className="result-item-art">
              <span aria-hidden="true">{itemGlyph(drawResult.result)}</span>
            </div>
            <h2>{drawResult.result.name}</h2>
            <p className="result-description">{drawResult.result.description}</p>
            <p className="result-note">{RARITY_NOTE[drawResult.result.rarity]}</p>

            {drawResult.was_duplicate && (
              <div className="duplicate-note">かぶりボーナス コイン +{drawResult.coin_earned}</div>
            )}
            {drawResult.pity?.triggered && (
              <div className="duplicate-note special">月光ゲージ達成。特別な光が届きました。</div>
            )}
            {drawResult.reaction && <p className="luna-reaction">{drawResult.reaction}</p>}

            <button type="button" onClick={closeResult}>閉じる</button>
          </section>
        </div>
      )}
    </main>
  )
}

function CollectionView({
  pool,
  ownedIds,
  collectionRate,
  ownedCount,
}: {
  pool: PoolItem[]
  ownedIds: Set<string>
  collectionRate: number
  ownedCount: number
}) {
  return (
    <section className="collection-panel" aria-label="コレクション図鑑">
      <div className="collection-summary">
        <div>
          <span>所持率</span>
          <strong>{collectionRate}%</strong>
        </div>
        <p>{ownedCount}/{pool.length} アイテム</p>
      </div>

      <div className="collection-grid scroll-thin">
        {pool.length === 0 ? (
          <p className="collection-empty">図鑑を読込中...</p>
        ) : (
          pool.map(item => {
            const owned = ownedIds.has(item.id)
            const meta = RARITY_META[item.rarity]
            return (
              <article
                key={item.id}
                className={`collection-card ${owned ? 'owned' : 'locked'}`}
                style={{
                  '--rarity-color': meta.color,
                  '--rarity-glow': meta.glow,
                } as CSSProperties}
                title={owned ? item.description ?? item.name : '未所持'}
              >
                <span className="collection-badge">{meta.short}</span>
                <div className="collection-art" aria-hidden="true">{itemGlyph(item)}</div>
                <h2>{owned ? item.name : '???'}</h2>
                <p>{owned ? CATEGORY_LABEL[item.category] : '未所持'}</p>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
