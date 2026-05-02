import { supabaseAdmin, T } from '../supabase'
import type { Rarity } from './gacha'

const USER_ID = '00000000-0000-0000-0000-000000000001'

type CountMap = Record<string, number>

interface PoolStats {
  total: number
  active: number
  inactive: number
  active_by_rarity: CountMap
  active_by_category: CountMap
}

interface HistoryStats {
  total_draws: number
  duplicate_draws: number
  coin_earned_total: number
  by_rarity: CountMap
  recent: Array<{
    pulled_at: string
    rarity: Rarity
    was_duplicate: boolean
    coin_earned: number
    item: {
      name: string
      category: string
    } | null
  }>
}

interface InventoryStats {
  total_unique_items: number
  by_rarity: CountMap
}

interface PityStats {
  available: boolean
  reason?: string
  draws_since_urban_legend?: number
  threshold?: number
  lifetime_draws?: number
  last_urban_legend_at?: string | null
  updated_at?: string | null
}

export interface GachaPoolStatsReport {
  timestamp: string
  pool: PoolStats
  inventory: InventoryStats
  history: HistoryStats
  pity: PityStats
}

function increment(map: CountMap, key: string | null | undefined): void {
  const safeKey = key || 'unknown'
  map[safeKey] = (map[safeKey] ?? 0) + 1
}

export async function getGachaPoolStats(): Promise<GachaPoolStatsReport> {
  const [poolResult, inventoryResult, historyResult, pityResult] = await Promise.all([
    supabaseAdmin
      .from(T.gachaPool)
      .select('id, rarity, category, is_active')
      .limit(1000),
    supabaseAdmin
      .from(T.gachaInventory)
      .select('pool:lunaria_gacha_pool(rarity)')
      .eq('user_id', USER_ID)
      .limit(1000),
    supabaseAdmin
      .from(T.gachaHistory)
      .select(`
        pulled_at,
        rarity,
        was_duplicate,
        coin_earned,
        pool:lunaria_gacha_pool(name, category)
      `)
      .eq('user_id', USER_ID)
      .order('pulled_at', { ascending: false })
      .limit(1000),
    supabaseAdmin
      .from(T.gachaPityState)
      .select('draws_since_urban_legend, lifetime_draws, last_urban_legend_at, updated_at')
      .eq('user_id', USER_ID)
      .maybeSingle(),
  ])

  if (poolResult.error) throw poolResult.error
  if (inventoryResult.error) throw inventoryResult.error
  if (historyResult.error) throw historyResult.error

  const poolRows = poolResult.data ?? []
  const inventoryRows = inventoryResult.data ?? []
  const historyRows = historyResult.data ?? []

  const activeByRarity: CountMap = {}
  const activeByCategory: CountMap = {}
  let active = 0

  for (const row of poolRows) {
    if (!row.is_active) continue
    active += 1
    increment(activeByRarity, row.rarity)
    increment(activeByCategory, row.category)
  }

  const inventoryByRarity: CountMap = {}
  for (const row of inventoryRows) {
    const pool = Array.isArray(row.pool) ? row.pool[0] : row.pool
    increment(inventoryByRarity, pool?.rarity)
  }

  const historyByRarity: CountMap = {}
  let duplicateDraws = 0
  let coinEarnedTotal = 0

  for (const row of historyRows) {
    increment(historyByRarity, row.rarity)
    if (row.was_duplicate) duplicateDraws += 1
    coinEarnedTotal += Number(row.coin_earned ?? 0)
  }

  return {
    timestamp: new Date().toISOString(),
    pool: {
      total: poolRows.length,
      active,
      inactive: poolRows.length - active,
      active_by_rarity: activeByRarity,
      active_by_category: activeByCategory,
    },
    inventory: {
      total_unique_items: inventoryRows.length,
      by_rarity: inventoryByRarity,
    },
    history: {
      total_draws: historyRows.length,
      duplicate_draws: duplicateDraws,
      coin_earned_total: coinEarnedTotal,
      by_rarity: historyByRarity,
      recent: historyRows.slice(0, 20).map(row => {
        const pool = Array.isArray(row.pool) ? row.pool[0] : row.pool
        return {
          pulled_at: row.pulled_at,
          rarity: row.rarity as Rarity,
          was_duplicate: row.was_duplicate,
          coin_earned: row.coin_earned,
          item: pool
            ? {
                name: pool.name,
                category: pool.category,
              }
            : null,
        }
      }),
    },
    pity: pityResult.error
      ? {
          available: false,
          reason: pityResult.error.message || 'not available',
        }
      : {
          available: true,
          draws_since_urban_legend: pityResult.data?.draws_since_urban_legend ?? 0,
          threshold: 100,
          lifetime_draws: pityResult.data?.lifetime_draws ?? 0,
          last_urban_legend_at: pityResult.data?.last_urban_legend_at ?? null,
          updated_at: pityResult.data?.updated_at ?? null,
        },
  }
}
