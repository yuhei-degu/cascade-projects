'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface InventoryItem {
  id: string
  name: string
  rarity: string
  category: string
  image_url: string | null
  description: string | null
  acquired_at: string
}

const RARITY_COLOR: Record<string, string> = {
  common_a:     '#9fb1b3',
  common_b:     '#9fb1b3',
  rare_a:       '#7fb3d5',
  rare_b:       '#7fb3d5',
  epic:         '#c39bd3',
  legendary:    '#f7ca18',
  urban_legend: '#ff6b6b',
}

const CATEGORY_LABEL: Record<string, string> = {
  furniture:    '家具',
  small_item:   '小物',
  accessory:    'アクセサリー',
  urban_legend: '都市伝説',
}

const CATEGORIES = ['all', 'furniture', 'small_item', 'accessory', 'urban_legend'] as const
type Category = typeof CATEGORIES[number]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filter, setFilter] = useState<Category>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gacha/inventory')
      .then(r => r.json())
      .then(d => {
        setItems(d.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto', padding: '20px',
    }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Link href="/gacha" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>← ガチャ</Link>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 'normal', color: '#ddd5c5' }}>
          コレクション
        </h1>
        <div style={{ width: '60px' }} />
      </div>

      {/* フィルター */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px',
        paddingBottom: '4px',
      }} className="scroll-thin">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              background: filter === c ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              color: filter === c ? '#ddd5c5' : '#888',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '6px 14px', fontSize: '12px',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {c === 'all' ? `すべて (${items.length})` : `${CATEGORY_LABEL[c]} (${items.filter(i => i.category === c).length})`}
          </button>
        ))}
      </div>

      {/* グリッド */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scroll-thin">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px', fontSize: '13px' }}>
            まだ何も持ってないよ。ガチャを引いてみて
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          }}>
            {filtered.map(item => (
              <div
                key={item.id}
                title={item.description ?? ''}
                style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
                  padding: '8px', border: `1px solid ${RARITY_COLOR[item.rarity] ?? '#333'}33`,
                  aspectRatio: '1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{
                  width: '100%', flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', marginBottom: '6px',
                }}>
                  {item.image_url
                    ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : '🎁'}
                </div>
                <div style={{
                  fontSize: '10px', color: '#ddd5c5', textAlign: 'center',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  width: '100%',
                }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
