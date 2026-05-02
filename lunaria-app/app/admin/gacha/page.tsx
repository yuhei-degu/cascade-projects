'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface StatsReport {
  timestamp: string
  pool: {
    total: number
    active: number
    inactive: number
    active_by_rarity: Record<string, number>
    active_by_category: Record<string, number>
  }
  inventory: {
    total_unique_items: number
    by_rarity: Record<string, number>
  }
  history: {
    total_draws: number
    duplicate_draws: number
    coin_earned_total: number
    by_rarity: Record<string, number>
    recent: Array<{
      pulled_at: string
      rarity: string
      was_duplicate: boolean
      coin_earned: number
      item: {
        name: string
        category: string
      } | null
    }>
  }
}

const RARITY_ORDER = ['common_a', 'common_b', 'rare_a', 'rare_b', 'epic', 'legendary', 'urban_legend']

function formatMap(map: Record<string, number>): string {
  return Object.entries(map)
    .sort(([a], [b]) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b) || a.localeCompare(b))
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ')
}

function pct(part: number, total: number): string {
  if (!total) return '0.0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 16,
      boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
    }}>
      <div style={{ color: '#7a7060', fontSize: 11, letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#ddd5c5', fontSize: 28 }}>{value}</div>
      {sub && <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function AdminGachaPage() {
  const [stats, setStats] = useState<StatsReport | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const completionRate = useMemo(() => {
    if (!stats) return '0.0%'
    return pct(stats.inventory.total_unique_items, stats.pool.active)
  }, [stats])

  const duplicateRate = useMemo(() => {
    if (!stats) return '0.0%'
    return pct(stats.history.duplicate_draws, stats.history.total_draws)
  }, [stats])

  async function loadStats(nextToken = token) {
    setLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {}
      if (nextToken.trim()) headers.authorization = `Bearer ${nextToken.trim()}`
      const response = await fetch('/api/admin/pool-stats', { headers, cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) {
        setStats(null)
        setError(body?.error === 'unauthorized' ? 'Admin token is required in production.' : 'Failed to load gacha stats.')
        return
      }
      setStats(body)
    } catch {
      setStats(null)
      setError('Failed to load gacha stats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem('lunaria_admin_status_token') ?? ''
    setToken(saved)
    void loadStats(saved)
  }, [])

  function saveTokenAndReload() {
    window.localStorage.setItem('lunaria_admin_status_token', token)
    void loadStats(token)
  }

  return (
    <div className="scroll-thin" style={{
      height: '100dvh',
      overflowY: 'auto',
      padding: 20,
      background: 'radial-gradient(circle at 10% 0%, rgba(127,179,213,0.09), transparent 32%), radial-gradient(circle at 90% 10%, rgba(255,107,107,0.07), transparent 30%)',
    }}>
      <main style={{ maxWidth: 920, margin: '0 auto', paddingBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/gacha" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>← Gacha</Link>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => loadStats()}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#ddd5c5',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        <section style={{ marginBottom: 24 }}>
          <div style={{ color: '#7fb3d5', fontSize: 12, letterSpacing: '.16em', marginBottom: 8 }}>
            LUNARIA OPERATIONS
          </div>
          <h1 style={{ color: '#ddd5c5', fontSize: 30, fontWeight: 400, marginBottom: 8 }}>
            Gacha Observatory
          </h1>
          <p style={{ color: '#7a7060', fontSize: 13, lineHeight: 1.7 }}>
            Read-only dashboard for the moon box pool, inventory, and recent draw history.
          </p>
        </section>

        {error && (
          <section style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.22)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ color: '#ffb0b0', fontSize: 13, marginBottom: 10 }}>{error}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                value={token}
                onChange={event => setToken(event.target.value)}
                placeholder="LUNARIA_ADMIN_STATUS_TOKEN"
                type="password"
                style={{
                  flex: 1,
                  minWidth: 240,
                  background: '#0e0d0b',
                  color: '#ddd5c5',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              />
              <button
                onClick={saveTokenAndReload}
                style={{
                  background: '#2d3a44',
                  color: '#ddd5c5',
                  border: '1px solid rgba(127,179,213,0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                Save token
              </button>
            </div>
          </section>
        )}

        {loading && <div style={{ color: '#888', padding: 24 }}>Loading gacha stats...</div>}

        {stats && (
          <>
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}>
              <StatCard label="ACTIVE POOL" value={`${stats.pool.active}/${stats.pool.total}`} sub={`${stats.pool.inactive} inactive`} />
              <StatCard label="INVENTORY" value={`${stats.inventory.total_unique_items}/${stats.pool.active}`} sub={completionRate} />
              <StatCard label="DRAWS" value={stats.history.total_draws} sub={`${duplicateRate} duplicate`} />
              <StatCard label="COINS EARNED" value={stats.history.coin_earned_total} sub="from duplicates" />
            </section>

            <section style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: '#ddd5c5', marginBottom: 14 }}>Pool Shape</h2>
              <div style={{ color: '#888', fontSize: 13, lineHeight: 1.8 }}>
                <div>Rarity: {formatMap(stats.pool.active_by_rarity)}</div>
                <div>Category: {formatMap(stats.pool.active_by_category)}</div>
                <div>Inventory: {formatMap(stats.inventory.by_rarity)}</div>
                <div>History: {formatMap(stats.history.by_rarity)}</div>
              </div>
            </section>

            <section style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18,
              padding: 18,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: '#ddd5c5', marginBottom: 14 }}>Recent Draws</h2>
              {stats.history.recent.length === 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>No draws yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {stats.history.recent.map((row, index) => (
                    <div
                      key={`${row.pulled_at}-${index}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(120px, 1fr) 96px 80px',
                        gap: 10,
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: index === stats.history.recent.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                        color: '#ddd5c5',
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <div>{row.item?.name ?? 'unknown item'}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>{new Date(row.pulled_at).toLocaleString('ja-JP')}</div>
                      </div>
                      <div style={{ color: '#7fb3d5' }}>{row.rarity}</div>
                      <div style={{ color: row.was_duplicate ? '#f7ca18' : '#888', textAlign: 'right' }}>
                        {row.was_duplicate ? `+${row.coin_earned}` : 'new'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div style={{ color: '#666', fontSize: 11, marginTop: 16 }}>
              Last updated: {new Date(stats.timestamp).toLocaleString('ja-JP')}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
