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
    name: 'Moonlit Uniform',
    category: 'outfit',
    rarity: 'common',
    description: 'Lunaria default outfit for quiet night conversations.',
    effect: 'default outfit',
    flavor_text: 'An ordinary night, an ordinary me.',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'acc_moon_pin',
    name: 'Crescent Hairpin',
    category: 'accessory',
    rarity: 'common',
    description: 'A small moon-shaped pin that catches the light.',
    effect: 'gentle accent',
    flavor_text: 'Tiny things can still change the whole sky.',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'bg_window_night',
    name: 'Night Window',
    category: 'background',
    rarity: 'common',
    description: 'A familiar room lit by the moon outside the window.',
    effect: 'room scene',
    flavor_text: 'The same window, the same promise to keep going.',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'expr_embarrassed',
    name: 'Embarrassed Smile',
    category: 'expression_unlock',
    rarity: 'rare',
    description: 'Unlocks a softer expression for close conversations.',
    effect: 'expression unlock',
    flavor_text: 'Do not stare too much. I mean it. Mostly.',
    owned: false,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
]

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  all: 'All',
  outfit: 'Outfits',
  accessory: 'Accessories',
  background: 'Backgrounds',
  room_item: 'Room Items',
  expression_unlock: 'Expressions',
  motion_unlock: 'Motions',
  special_diary_skin: 'Diary Skins',
  small_item: 'Small Items',
  urban_legend: 'Urban Legends',
}

const RARITY_COLOR: Record<ItemRarity, string> = {
  common: '#9E9CC2',
  rare: '#8ebad8',
  epic: '#D6B26C',
  legendary: '#E5C98E',
  urban_legend: '#ff8d8d',
}

const FILTERS: ItemCategory[] = ['all', 'outfit', 'accessory', 'background', 'room_item', 'small_item', 'urban_legend']
const PAGE_BG = '#0e0d0b'
const CARD_BG = '#181612'
const TEXT_MAIN = '#ddd5c5'
const TEXT_SUB = '#a39c8c'
const TEXT_DIM = '#7a7468'

export default function ItemsPage() {
  const [data, setData] = useState<ItemsResponse>({
    items: FALLBACK_ITEMS,
    source: 'mock',
    db_ready: false,
    note: 'local fallback',
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
        if (alive) setData({ items: FALLBACK_ITEMS, source: 'mock', db_ready: false, note: `local fallback: ${error.message}` })
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
    <main style={{ minHeight: '100vh', background: PAGE_BG, color: TEXT_MAIN, padding: '40px 20px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <Link href="/" style={navLinkStyle}>Back to Room</Link>
          <Link href="/gacha" style={navLinkStyle}>Moonbox</Link>
          <Link href="/character" style={navLinkStyle}>Character State</Link>
        </nav>

        <section style={{ ...panelStyle, marginBottom: 22 }}>
          <p style={{ color: '#B99B6B', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, fontSize: 12 }}>Inventory Preview</p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.8rem)', lineHeight: 0.92, margin: '12px 0 16px' }}>Moonbox Shelf</h1>
          <p style={{ maxWidth: 720, color: TEXT_SUB, lineHeight: 1.8, margin: 0 }}>
            A quiet shelf for Lunaria items. It reads from the future user_items table when available,
            falls back to current gacha inventory, and keeps this page useful before migration 020 is applied.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            <Metric label="Owned" value={`${ownedCount}/${data.items.length}`} />
            <Metric label="Completion" value={`${completion}%`} />
            <Metric label="Source" value={data.source} />
          </div>
          <p style={{ color: data.db_ready ? '#8fd19e' : '#d7b56d', margin: '18px 0 0', fontSize: 13 }}>
            {loading ? 'Loading item source...' : data.note}
          </p>
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
            Show unowned
          </label>
        </section>

        {filteredItems.length === 0 ? (
          <section style={emptyStyle}>No items match this filter yet.</section>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {filteredItems.map(item => (
              <article key={item.id} style={{ ...itemCardStyle, opacity: item.owned ? 1 : 0.52 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: RARITY_COLOR[item.rarity], margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11 }}>
                      {item.rarity.replace('_', ' ')}
                    </p>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{item.name}</h2>
                  </div>
                  <span style={item.owned ? ownedBadgeStyle : lockedBadgeStyle}>{item.owned ? 'Owned' : 'Locked'}</span>
                </div>
                <p style={{ color: TEXT_SUB, lineHeight: 1.7 }}>{item.description}</p>
                <p style={{ color: TEXT_DIM, fontStyle: 'italic', lineHeight: 1.6 }}>&quot;{item.flavor_text}&quot;</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: TEXT_DIM, fontSize: 12 }}>
                  <span>{CATEGORY_LABEL[item.category]}</span>
                  <span>{item.duplicate_count > 0 ? `dupes +${item.duplicate_count}` : item.source}</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
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

const navLinkStyle = {
  color: TEXT_MAIN,
  textDecoration: 'none',
  border: '1px solid rgba(214, 178, 108, 0.26)',
  borderRadius: 999,
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.03)',
}

const panelStyle = {
  background: `radial-gradient(circle at top left, rgba(214,178,108,0.15), transparent 36%), ${CARD_BG}`,
  border: '1px solid rgba(214, 178, 108, 0.18)',
  borderRadius: 28,
  padding: 'clamp(24px, 5vw, 42px)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
}

const filterStyle = {
  border: '1px solid rgba(221,213,197,0.16)',
  borderRadius: 999,
  padding: '9px 13px',
  background: 'rgba(255,255,255,0.03)',
  color: TEXT_SUB,
  cursor: 'pointer',
}

const activeFilterStyle = {
  ...filterStyle,
  color: '#111',
  background: '#D6B26C',
  borderColor: '#D6B26C',
}

const itemCardStyle = {
  background: CARD_BG,
  border: '1px solid rgba(221,213,197,0.12)',
  borderRadius: 22,
  padding: 20,
}

const ownedBadgeStyle = {
  borderRadius: 999,
  background: 'rgba(143,209,158,0.13)',
  color: '#8fd19e',
  padding: '6px 10px',
  fontSize: 12,
}

const lockedBadgeStyle = {
  ...ownedBadgeStyle,
  background: 'rgba(255,255,255,0.05)',
  color: TEXT_DIM,
}

const emptyStyle = {
  ...itemCardStyle,
  color: TEXT_SUB,
  textAlign: 'center' as const,
  padding: 36,
}
