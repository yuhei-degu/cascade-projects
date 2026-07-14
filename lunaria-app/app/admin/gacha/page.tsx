'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ApiErrorState, { DEFAULT_API_ERROR_MESSAGE } from '@/components/ApiErrorState'

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
  pity: {
    available: boolean
    reason?: string
    draws_since_urban_legend?: number
    threshold?: number
    lifetime_draws?: number
    last_urban_legend_at?: string | null
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
      borderRadius: 'var(--luna-radius-lg)',
      padding: 16,
      boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
    }}>
      <div style={{ color: '#7a7060', fontSize: 11, letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ color: 'var(--luna-text-soft)', fontSize: 28 }}>{value}</div>
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
        setError(body?.error === 'unauthorized' ? '管理トークンが必要です。' : DEFAULT_API_ERROR_MESSAGE)
        return
      }
      setStats(body)
    } catch {
      setStats(null)
      setError(DEFAULT_API_ERROR_MESSAGE)
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
          <Link href="/gacha" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>← ガチャ</Link>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => loadStats()}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--luna-text-soft)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            更新
          </button>
        </div>

        <section style={{ marginBottom: 24 }}>
          <div style={{ color: '#7fb3d5', fontSize: 12, letterSpacing: '.16em', marginBottom: 8 }}>
            LUNARIA 運用
          </div>
          <h1 style={{ color: 'var(--luna-text-soft)', fontSize: 30, fontWeight: 400, marginBottom: 8 }}>
            ガチャ観測所
          </h1>
          <p style={{ color: '#7a7060', fontSize: 13, lineHeight: 1.7 }}>
            月箱の排出プール、所持品、最近の抽選履歴を確認する読み取り専用ダッシュボードです。
          </p>
        </section>

        {error && (
          <section style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.22)',
            borderRadius: 'var(--luna-radius-lg)',
            padding: 16,
            marginBottom: 20,
          }}>
            <ApiErrorState message={error} onRetry={() => loadStats()} compact style={{ marginBottom: 10 }} />
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
                  color: 'var(--luna-text-soft)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              />
              <button
                onClick={saveTokenAndReload}
                style={{
                  background: '#2d3a44',
                  color: 'var(--luna-text-soft)',
                  border: '1px solid rgba(127,179,213,0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                トークンを保存
              </button>
            </div>
          </section>
        )}

        {loading && <div style={{ color: '#888', padding: 24 }}>ガチャ統計を読み込んでいます...</div>}

        {stats && (
          <>
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}>
              <StatCard label="有効プール" value={`${stats.pool.active}/${stats.pool.total}`} sub={`${stats.pool.inactive}件 無効`} />
              <StatCard label="所持品" value={`${stats.inventory.total_unique_items}/${stats.pool.active}`} sub={completionRate} />
              <StatCard label="抽選数" value={stats.history.total_draws} sub={`${duplicateRate} 重複`} />
              <StatCard label="獲得コイン" value={stats.history.coin_earned_total} sub="重複分" />
              <StatCard
                label="月光ゲージ"
                value={stats.pity.available ? `${stats.pity.draws_since_urban_legend ?? 0}/${stats.pity.threshold ?? 100}` : '無効'}
                sub={stats.pity.available ? `累計 ${stats.pity.lifetime_draws ?? 0}回` : 'migration未適用'}
              />
            </section>

            <section style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--luna-radius-lg)',
              padding: 18,
              marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: 'var(--luna-text-soft)', marginBottom: 14 }}>プール構成</h2>
              <div style={{ color: '#888', fontSize: 13, lineHeight: 1.8 }}>
                <div>レアリティ: {formatMap(stats.pool.active_by_rarity)}</div>
                <div>カテゴリ: {formatMap(stats.pool.active_by_category)}</div>
                <div>所持品: {formatMap(stats.inventory.by_rarity)}</div>
                <div>履歴: {formatMap(stats.history.by_rarity)}</div>
                <div>
                  天井: {stats.pity.available
                    ? `最後の都市伝説=${stats.pity.last_urban_legend_at ? new Date(stats.pity.last_urban_legend_at).toLocaleString('ja-JP') : 'なし'}`
                    : `利用不可 (${stats.pity.reason ?? 'migration未適用'})`}
                </div>
              </div>
            </section>

            <section style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--luna-radius-lg)',
              padding: 18,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 400, color: 'var(--luna-text-soft)', marginBottom: 14 }}>最近の抽選</h2>
              {stats.history.recent.length === 0 ? (
                <div style={{ color: '#888', fontSize: 13 }}>抽選履歴はまだありません。</div>
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
                        color: 'var(--luna-text-soft)',
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <div>{row.item?.name ?? '不明な品'}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>{new Date(row.pulled_at).toLocaleString('ja-JP')}</div>
                      </div>
                      <div style={{ color: '#7fb3d5' }}>{row.rarity}</div>
                      <div style={{ color: row.was_duplicate ? '#f7ca18' : '#888', textAlign: 'right' }}>
                        {row.was_duplicate ? `+${row.coin_earned}` : '新規'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div style={{ color: '#666', fontSize: 11, marginTop: 16 }}>
              最終更新: {new Date(stats.timestamp).toLocaleString('ja-JP')}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
