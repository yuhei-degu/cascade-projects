'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import ApiErrorState, { DEFAULT_API_ERROR_MESSAGE } from '@/components/ApiErrorState'

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
  common_a: '#f2f3f0',
  common_b: '#f2f3f0',
  rare_a: '#7fb3d5',
  rare_b: '#7fb3d5',
  epic: '#f1c77f',
  legendary: '#ffb15f',
  urban_legend: '#ff7d9b',
}

const CATEGORY_LABEL: Record<string, string> = {
  furniture: '家具',
  small_item: '小物',
  accessory: 'アクセサリー',
  urban_legend: '都市伝説',
}

const CATEGORY_GLYPH: Record<string, string> = {
  furniture: '□',
  small_item: '◇',
  accessory: '○',
  urban_legend: '✦',
}

const CATEGORIES = ['all', 'furniture', 'small_item', 'accessory', 'urban_legend'] as const
type Category = typeof CATEGORIES[number]

function itemGlyph(item: InventoryItem): string {
  if (item.rarity === 'urban_legend') return CATEGORY_GLYPH.urban_legend
  return CATEGORY_GLYPH[item.category] ?? '◇'
}

function InventorySkeleton() {
  return (
    <div aria-label="所持品を読み込み中" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="luna-skeleton" style={{ aspectRatio: '1', padding: 8 }}>
          <div className="luna-skeleton" style={{ height: '72%', marginBottom: 8, borderRadius: 'var(--luna-radius-sm)' }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '70%', margin: '0 auto' }} />
        </div>
      ))}
    </div>
  )
}

function InventoryEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="luna-empty">
      <span className="luna-empty-icon" aria-hidden="true">◇</span>
      <strong className="luna-empty-title">
        {filtered ? 'この棚には、まだ品がありません。' : '月箱の棚は、まだ空です。'}
      </strong>
      <p className="luna-empty-copy">
        {filtered
          ? 'カテゴリを切り替えると、ほかの所持品が見つかるかもしれません。'
          : '月箱で手に入れた品が、ここに少しずつ並びます。'}
      </p>
    </div>
  )
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filter, setFilter] = useState<Category>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInventory = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/gacha/inventory')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => {
        setItems(d.items ?? [])
      })
      .catch(() => {
        setItems([])
        setError(DEFAULT_API_ERROR_MESSAGE)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

  return (
    <main style={{
      height: '100dvh',
      maxWidth: 480,
      margin: '0 auto',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--luna-text)',
      background: 'radial-gradient(circle at 50% 0%, rgba(241,199,127,.13), transparent 34%), radial-gradient(circle at 85% 10%, rgba(127,179,213,.08), transparent 30%), linear-gradient(180deg, var(--luna-bg) 0%, var(--luna-bg-soft) 100%)',
    }}>
      <nav aria-label="ガチャ所持品のナビゲーション" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Link href="/gacha" aria-label="ガチャに戻る" style={{ minWidth: 72, color: 'var(--luna-muted)', textDecoration: 'none', fontSize: 14 }}>月箱へ</Link>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 500, color: 'var(--luna-text)' }}>
          月箱の棚
        </h1>
        <Link href="/" aria-label="Lunariaの部屋を開く" style={{ minWidth: 72, color: 'var(--luna-muted)', textDecoration: 'none', fontSize: 14, textAlign: 'right' }}>部屋へ</Link>
      </nav>

      <p style={{ color: 'var(--luna-faint)', fontSize: 12, lineHeight: 1.7, textAlign: 'center', marginBottom: 16 }}>
        Lunariaから受け取った品だけを、静かに並べておく場所です。
      </p>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }} className="scroll-thin">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            style={{
              background: filter === category ? 'var(--luna-gold)' : 'rgba(241,199,127,.055)',
              color: filter === category ? '#100d09' : 'var(--luna-muted)',
              border: filter === category ? '1px solid rgba(241,199,127,.52)' : '1px solid var(--luna-border)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {category === 'all' ? `すべて (${items.length})` : `${CATEGORY_LABEL[category]} (${items.filter(i => i.category === category).length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="scroll-thin">
        {error ? (
          <ApiErrorState message={error} onRetry={loadInventory} />
        ) : loading ? (
          <InventorySkeleton />
        ) : filtered.length === 0 ? (
          <InventoryEmpty filtered={filter !== 'all'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {filtered.map(item => {
              const color = RARITY_COLOR[item.rarity] ?? 'var(--luna-gold)'
              return (
                <article
                  key={item.id}
                  title={item.description ?? ''}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 8,
                    border: `1px solid ${color}55`,
                    borderRadius: 'var(--luna-radius-sm)',
                    background: 'rgba(255,247,232,.04)',
                    boxShadow: 'var(--luna-shadow-sm)',
                  }}
                >
                  <div style={{
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                    borderRadius: 'var(--luna-radius-sm)',
                    background: `radial-gradient(circle at 50% 35%, ${color}33, rgba(8,7,6,.56) 68%)`,
                    color,
                    fontSize: 32,
                    textShadow: `0 0 22px ${color}55`,
                  }}>
                    <span aria-hidden="true">{itemGlyph(item)}</span>
                  </div>
                  <div style={{ width: '100%', color: 'var(--luna-text)', fontSize: 10, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
