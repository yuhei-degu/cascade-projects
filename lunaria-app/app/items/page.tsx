'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ItemCategory =
  | 'all'
  | 'outfit'
  | 'accessory'
  | 'background'
  | 'room_item'
  | 'expression_unlock'
  | 'motion_unlock'
  | 'special_diary_skin'
  | 'small_item'
  | 'urban_legend'

type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'urban_legend'

type ItemView = {
  id: string
  name: string
  category: Exclude<ItemCategory, 'all'>
  rarity: ItemRarity
  description: string
  effect: string
  flavor_text: string
  owned: boolean
  duplicate_count: number
  obtained_at: string | null
  source: 'user_items' | 'gacha_inventory' | 'mock'
}

type ItemsResponse = {
  items: ItemView[]
  source: 'user_items' | 'gacha_inventory' | 'mock'
  db_ready: boolean
  note: string
}

const FALLBACK_ITEMS: ItemView[] = [
  {
    id: 'outfit_default',
    name: '月明かりの制服',
    category: 'outfit',
    rarity: 'common',
    description: '静かな夜の会話に似合うLunariaの基本衣装。',
    effect: '基本衣装',
    flavor_text: 'いつもの夜、いつものわたし。',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'acc_moon_pin',
    name: '三日月のヘアピン',
    category: 'accessory',
    rarity: 'common',
    description: '光を受けてきらめく、小さな月形のピン。',
    effect: 'やさしいアクセント',
    flavor_text: '小さなものでも、空ぜんぶの見え方を変えられる。',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'bg_window_night',
    name: '夜の窓辺',
    category: 'background',
    rarity: 'common',
    description: '窓の外の月に照らされた、見慣れた部屋。',
    effect: '部屋の背景',
    flavor_text: '同じ窓、同じ続けていく約束。',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'expr_embarrassed',
    name: '照れた笑顔',
    category: 'expression_unlock',
    rarity: 'rare',
    description: '近い距離の会話に合う、やわらかな表情を解放します。',
    effect: '表情解放',
    flavor_text: 'あまり見つめないで。本気で言ってる。たぶん。',
    owned: false,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
]

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  all: 'すべて',
  outfit: '衣装',
  accessory: 'アクセサリー',
  background: '背景',
  room_item: '部屋の品',
  expression_unlock: '表情',
  motion_unlock: '動き',
  special_diary_skin: '日記スキン',
  small_item: '小物',
  urban_legend: '都市伝説',
}

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#9E9CC2',
  rare: '#8ebad8',
  epic: '#D6B26C',
  legendary: '#E5C98E',
  urban_legend: '#ff8d8d',
}

const RARITY_LABEL: Record<ItemRarity, string> = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー',
  urban_legend: '都市伝説',
}

const SOURCE_LABEL: Record<ItemView['source'], string> = {
  user_items: '所持品DB',
  gacha_inventory: 'ガチャ所持品',
  mock: '代替データ',
}

const FILTERS: ItemCategory[] = ['all', 'outfit', 'accessory', 'background', 'room_item', 'small_item', 'urban_legend']
const PAGE_BG = 'var(--luna-bg)'
const CARD_BG = 'var(--luna-surface-raised)'
const TEXT_MAIN = 'var(--luna-text)'
const TEXT_SUB = 'var(--luna-text-soft)'
const TEXT_DIM = 'var(--luna-faint)'

export default function ItemsPage() {
  const [data, setData] = useState<ItemsResponse>({
    items: FALLBACK_ITEMS,
    source: 'mock',
    db_ready: false,
    note: 'ローカルの代替データ',
  })
  const [activeFilter, setActiveFilter] = useState<ItemCategory>('all')
  const [showUnowned, setShowUnowned] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/items', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((nextData: ItemsResponse) => {
        if (alive) setData(nextData)
      })
      .catch(error => {
        if (alive) setData({ items: FALLBACK_ITEMS, source: 'mock', db_ready: false, note: `ローカルの代替データ: ${error.message}` })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      const matchesCategory = activeFilter === 'all' || item.category === activeFilter
      const matchesOwnership = showUnowned || item.owned
      return matchesCategory && matchesOwnership
    })
  }, [activeFilter, data.items, showUnowned])

  const ownedCount = data.items.filter(item => item.owned).length
  const completion = data.items.length > 0 ? Math.round((ownedCount / data.items.length) * 100) : 0

  return (
    <main style={{
      minHeight: '100vh',
      overflowY: 'auto',
      background: 'radial-gradient(circle at 18% 8%, rgba(241,199,127,.15), transparent 34%), radial-gradient(circle at 84% 14%, rgba(127,179,213,.08), transparent 28%), linear-gradient(180deg, var(--luna-bg), var(--luna-bg-soft))',
      color: TEXT_MAIN,
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <nav aria-label="品のナビゲーション" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <Link href="/" aria-label="Lunariaの部屋に戻る" style={navLinkStyle}>部屋に戻る</Link>
          <Link href="/gacha" aria-label="ガチャを開く" style={navLinkStyle}>月箱</Link>
          <Link href="/character" aria-label="姿を開く" style={navLinkStyle}>姿の状態</Link>
        </nav>

        <section style={{ ...panelStyle, marginBottom: 22 }}>
          <p style={{ color: '#B99B6B', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, fontSize: 12 }}>所持品プレビュー</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.8rem)', lineHeight: 0.92, margin: '12px 0 16px' }}>月箱の棚</h1>
          <p style={{ maxWidth: 720, color: TEXT_SUB, lineHeight: 1.8, margin: 0 }}>
            Lunariaの品を静かに並べる棚です。利用できる場合は将来のユーザー所持品テーブルを読み、
            それまでは現在のガチャ所持品または代替データを使います。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            <Metric label="所持数" value={`${ownedCount}/${data.items.length}`} />
            <Metric label="達成率" value={`${completion}%`} />
            <Metric label="取得元" value={SOURCE_LABEL[data.source]} />
          </div>
          <SourceBanner
            ready={data.db_ready}
            loading={loading}
            title={data.db_ready ? 'DBの品棚が有効です' : '代替の品棚が有効です'}
            note={loading ? '品の取得元を確認しています...' : data.note}
            detail={
              data.db_ready
                ? 'このページは永続化されたユーザー所持品レイヤーを読んでいます。'
                : '安全なプレビューモードです。migration 020が適用されるまで、ガチャ所持品またはローカルの代替データを使います。'
            }
          />
        </section>

        <section style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                style={filter === activeFilter ? activeFilterStyle : filterStyle}
              >
                {CATEGORY_LABEL[filter]}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_SUB, cursor: 'pointer' }}>
            <input type="checkbox" checked={showUnowned} onChange={event => setShowUnowned(event.target.checked)} />
            未所持も表示
          </label>
        </section>

        {loading ? (
          <ItemsSkeleton />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="この条件に合う品はまだありません。"
            copy="カテゴリを切り替えるか、未所持の品も表示してみてください。月箱で手に入れた品はここに並びます。"
          />
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {filteredItems.map(item => (
              <article key={item.id} style={{ ...itemCardStyle, opacity: item.owned ? 1 : 0.52 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: RARITY_COLOR[item.rarity], margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11 }}>
                      {RARITY_LABEL[item.rarity]}
                    </p>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{item.name}</h2>
                  </div>
                  <span style={item.owned ? ownedBadgeStyle : lockedBadgeStyle}>{item.owned ? '所持中' : '未所持'}</span>
                </div>
                <p style={{ color: TEXT_SUB, lineHeight: 1.7 }}>{item.description}</p>
                <p style={{ color: TEXT_DIM, fontStyle: 'italic', lineHeight: 1.6 }}>&quot;{item.flavor_text}&quot;</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: TEXT_DIM, fontSize: 12 }}>
                  <span>{CATEGORY_LABEL[item.category]}</span>
                  <span>{item.duplicate_count > 0 ? `重複 +${item.duplicate_count}` : SOURCE_LABEL[item.source]}</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

function ItemsSkeleton() {
  return (
    <section aria-label="品を読み込み中" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="luna-skeleton" style={{ height: 210, padding: 20 }}>
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '34%', marginBottom: 16 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '62%', height: 18, marginBottom: 22 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '100%', marginBottom: 10 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '86%', marginBottom: 34 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '46%' }} />
        </article>
      ))}
    </section>
  )
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <section className="luna-empty">
      <span className="luna-empty-icon" aria-hidden="true">◇</span>
      <strong className="luna-empty-title">{title}</strong>
      <p className="luna-empty-copy">{copy}</p>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 126, border: '1px solid rgba(214, 178, 108, 0.22)', borderRadius: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ color: TEXT_DIM, fontSize: 12 }}>{label}</div>
      <div style={{ color: TEXT_MAIN, fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
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
        {loading ? '品の取得元を確認しています...' : title}
      </div>
      <div style={{ color: TEXT_SUB, fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>{note}</div>
      <div style={{ color: TEXT_DIM, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{detail}</div>
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

const panelStyle = {
  background: `radial-gradient(circle at top left, rgba(241,199,127,.15), transparent 36%), ${CARD_BG}`,
  border: '1px solid var(--luna-border)',
  borderRadius: 18,
  padding: 'clamp(24px, 5vw, 42px)',
  boxShadow: 'var(--luna-shadow)',
}

const filterStyle = {
  border: '1px solid var(--luna-border)',
  borderRadius: 999,
  padding: '9px 13px',
  background: 'rgba(241,199,127,.055)',
  color: TEXT_SUB,
  cursor: 'pointer',
}

const activeFilterStyle = {
  ...filterStyle,
  color: '#100d09',
  background: 'var(--luna-gold)',
  borderColor: 'rgba(241,199,127,.52)',
}

const itemCardStyle = {
  background: 'linear-gradient(145deg, rgba(27,23,17,.9), rgba(14,13,11,.96))',
  border: '1px solid var(--luna-border)',
  borderRadius: 18,
  padding: 20,
  boxShadow: 'var(--luna-shadow)',
}

const ownedBadgeStyle = {
  borderRadius: 999,
  background: 'rgba(143,209,158,0.13)',
  color: 'var(--luna-green)',
  padding: '6px 10px',
  fontSize: 12,
}

const lockedBadgeStyle = {
  ...ownedBadgeStyle,
  background: 'rgba(255,255,255,0.05)',
  color: TEXT_DIM,
}
