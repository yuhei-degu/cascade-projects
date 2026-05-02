// Phase G: ガチャエンジン
// 設計書：mnt/lunaria/PHASE_G_GACHA_DESIGN.md
//
// 哲学：ガチャは Lunaria のサブ機能。会話・関係性とは独立。
//       lunaria_core_memory / lunaria_user_profile とは完全分離。

import { randomBytes } from 'crypto'
import { supabaseAdmin, T } from '../supabase'

const USER_ID = '00000000-0000-0000-0000-000000000001'

// ── 型定義 ───────────────────────────────────────────────────
export type Rarity =
  | 'common_a' | 'common_b' | 'rare_a' | 'rare_b'
  | 'epic' | 'legendary' | 'urban_legend'

export type Category = 'furniture' | 'small_item' | 'accessory' | 'urban_legend'

export interface PoolItem {
  id: string
  name: string
  rarity: Rarity
  category: Category
  drop_weight: number
  image_url: string | null
  description: string | null
}

export interface DrawResult {
  result: PoolItem
  was_duplicate: boolean
  coin_earned: number
  ticket_remaining: number
  coin_balance: number
  production_seed: number
  pity: GachaPityState | null
}

export interface GachaPityState {
  draws_since_urban_legend: number
  threshold: number
  triggered: boolean
}

export interface GachaState {
  ticket_count: number
  coin_balance: number
  earned_today: number
  daily_bonus_available: boolean
  pity: GachaPityState | null
}

function throwIfSupabaseError(label: string, error: unknown): void {
  if (error) throw new Error(`[gacha] ${label}`, { cause: error })
}

function supabaseMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const record = error as { code?: unknown; message?: unknown }
  return `${String(record.code ?? '')} ${String(record.message ?? '')}`.trim()
}

function isMissingPityInfrastructure(error: unknown): boolean {
  const message = supabaseMessage(error)
  return (
    message.includes('PGRST202') ||
    message.includes('PGRST205') ||
    message.includes('42P01') ||
    message.includes('42703') ||
    message.includes('draw_gacha_v2') ||
    message.includes('lunaria_gacha_pity_state') ||
    message.includes('pity_before')
  )
}

async function fetchTicketCount(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from(T.gachaTickets)
    .select('count')
    .eq('user_id', USER_ID)
    .maybeSingle()
  throwIfSupabaseError('fetch tickets failed', error)
  return data?.count ?? 0
}

// ── 確率テーブル（仕様 v5）─────────────────────────────────
const RARITY_CUMULATIVE: { rarity: Rarity; cumulative: number }[] = [
  { rarity: 'common_a',     cumulative: 0.45 },
  { rarity: 'common_b',     cumulative: 0.75 },
  { rarity: 'rare_a',       cumulative: 0.89 },
  { rarity: 'rare_b',       cumulative: 0.96 },
  { rarity: 'epic',         cumulative: 0.99 },
  { rarity: 'legendary',    cumulative: 0.999 },
  { rarity: 'urban_legend', cumulative: 1.0 },
]

// ── 暗号論的安全な乱数 [0, 1) ──────────────────────────────
function secureRandom(): number {
  const buf = randomBytes(4)
  return buf.readUInt32BE(0) / 0x100000000
}

// ── レアリティ抽選 ─────────────────────────────────────────
function pickRarity(): Rarity {
  const r = secureRandom()
  return RARITY_CUMULATIVE.find(w => r < w.cumulative)!.rarity
}

// ── レアリティ内のアイテム抽選（drop_weight で重み付け） ──
function pickItemInRarity(items: PoolItem[]): PoolItem {
  if (items.length === 0) throw new Error(`empty_rarity_pool`)
  const total = items.reduce((s, i) => s + Number(i.drop_weight), 0)
  let r = secureRandom() * total
  for (const item of items) {
    r -= Number(item.drop_weight)
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

// ── 排出物カタログ取得（is_active のみ）────────────────────
export async function fetchPool(): Promise<PoolItem[]> {
  const { data, error } = await supabaseAdmin
    .from(T.gachaPool)
    .select('id, name, rarity, category, drop_weight, image_url, description')
    .eq('is_active', true)
  if (error) throw error
  return (data ?? []) as PoolItem[]
}

async function fetchPoolByRarity(rarity: Rarity): Promise<PoolItem[]> {
  const { data, error } = await supabaseAdmin
    .from(T.gachaPool)
    .select('id, name, rarity, category, drop_weight, image_url, description')
    .eq('is_active', true)
    .eq('rarity', rarity)
  if (error) throw error
  return (data ?? []) as PoolItem[]
}

async function fetchPityState(): Promise<GachaPityState | null> {
  const { data, error } = await supabaseAdmin
    .from(T.gachaPityState)
    .select('draws_since_urban_legend')
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (error) {
    if (isMissingPityInfrastructure(error)) return null
    throw error
  }

  return {
    draws_since_urban_legend: data?.draws_since_urban_legend ?? 0,
    threshold: 100,
    triggered: false,
  }
}

// ── ガチャ実行（1 連） ─────────────────────────────────────
export async function drawGacha(): Promise<DrawResult> {
  const pity = await fetchPityState()

  // 1. レアリティ抽選
  const rarity = pity && pity.draws_since_urban_legend >= 99
    ? 'urban_legend'
    : pickRarity()

  // 2. レアリティ内のアイテム抽選
  const items = await fetchPoolByRarity(rarity)
  if (items.length === 0) {
    // データ不整合：そのレアリティに 1 件もない場合のフォールバック
    // 1 段階下げて common_a に回避
    console.warn(`[gacha] empty pool for rarity=${rarity}, falling back to common_a`)
    const fallback = await fetchPoolByRarity('common_a')
    if (fallback.length === 0) throw new Error('gacha_pool_empty')
    return await executeDraw(pickItemInRarity(fallback), 'common_a', pity)
  }
  const item = pickItemInRarity(items)
  try {
    return await executeDraw(item, rarity, pity)
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'pity_required') throw error
    const urbanItems = await fetchPoolByRarity('urban_legend')
    if (urbanItems.length === 0) throw new Error('gacha_pool_empty')
    return await executeDraw(pickItemInRarity(urbanItems), 'urban_legend', pity)
  }
}

async function executeDraw(item: PoolItem, rarity: Rarity, pity: GachaPityState | null): Promise<DrawResult> {
  // 3. RPC でチケット消費・かぶり判定・コイン変換・履歴記録を 1 トランザクションで
  const rpcName = pity ? 'draw_gacha_v2' : 'draw_gacha'
  const { data, error } = await supabaseAdmin.rpc(rpcName, {
    p_user_id: USER_ID,
    p_pool_id: item.id,
    p_rarity:  rarity,
  })
  if (error) {
    if (pity && isMissingPityInfrastructure(error)) {
      return await executeLegacyDraw(item, rarity)
    }
    if (String(error.message ?? '').includes('pity_required')) {
      throw new Error('pity_required')
    }
    // チケット切れは error.message が 'no_ticket' を含む
    if (String(error.message ?? '').includes('no_ticket')) {
      throw new Error('no_ticket')
    }
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  const pityAfter = typeof row.pity_after === 'number'
    ? row.pity_after
    : (rarity === 'urban_legend' ? 0 : (pity?.draws_since_urban_legend ?? 0) + 1)

  return {
    result: item,
    was_duplicate:    row.was_duplicate,
    coin_earned:      row.coin_earned,
    ticket_remaining: row.ticket_remaining,
    coin_balance:     row.coin_balance,
    // 演出シーケンス決定用 seed（クライアントが運勢色・カットイン色を決定論的に選ぶ）
    production_seed:  Math.floor(secureRandom() * 0xffffffff),
    pity: pity
      ? {
          draws_since_urban_legend: pityAfter,
          threshold: 100,
          triggered: Boolean(row.pity_triggered),
        }
      : null,
  }
}

async function executeLegacyDraw(item: PoolItem, rarity: Rarity): Promise<DrawResult> {
  const { data, error } = await supabaseAdmin.rpc('draw_gacha', {
    p_user_id: USER_ID,
    p_pool_id: item.id,
    p_rarity:  rarity,
  })
  if (error) {
    if (String(error.message ?? '').includes('no_ticket')) {
      throw new Error('no_ticket')
    }
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    result: item,
    was_duplicate:    row.was_duplicate,
    coin_earned:      row.coin_earned,
    ticket_remaining: row.ticket_remaining,
    coin_balance:     row.coin_balance,
    production_seed:  Math.floor(secureRandom() * 0xffffffff),
    pity:             null,
  }
}

// ── 状態取得（チケット・コイン・本日獲得済み） ────────────
export async function getGachaState(): Promise<GachaState> {
  const today = new Date().toISOString().slice(0, 10)
  const [tickets, coins, quota, dailyBonus, pity] = await Promise.all([
    supabaseAdmin.from(T.gachaTickets).select('count').eq('user_id', USER_ID).maybeSingle(),
    supabaseAdmin.from(T.gachaCoins).select('balance').eq('user_id', USER_ID).maybeSingle(),
    supabaseAdmin.from(T.gachaDailyQuota).select('earned_today')
      .eq('user_id', USER_ID).eq('given_date', today).maybeSingle(),
    supabaseAdmin.from(T.gachaDailyBonus).select('user_id')
      .eq('user_id', USER_ID).eq('given_date', today).maybeSingle(),
    fetchPityState(),
  ])
  throwIfSupabaseError('fetch ticket state failed', tickets.error)
  throwIfSupabaseError('fetch coin state failed', coins.error)
  throwIfSupabaseError('fetch daily quota failed', quota.error)
  throwIfSupabaseError('fetch daily bonus state failed', dailyBonus.error)

  return {
    ticket_count:          tickets.data?.count ?? 0,
    coin_balance:          coins.data?.balance ?? 0,
    earned_today:          quota.data?.earned_today ?? 0,
    daily_bonus_available: !dailyBonus.data,
    pity,
  }
}

// ── インベントリ取得 ──────────────────────────────────────
export interface InventoryItem extends PoolItem {
  acquired_at: string
}

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabaseAdmin
    .from(T.gachaInventory)
    .select(`
      acquired_at,
      pool:lunaria_gacha_pool(id, name, rarity, category, drop_weight, image_url, description)
    `)
    .eq('user_id', USER_ID)
    .order('acquired_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row.pool,
    acquired_at: row.acquired_at,
  })) as InventoryItem[]
}

// ── デイリーボーナス受取 ──────────────────────────────────
export async function claimDailyBonus(): Promise<{ granted: boolean; ticket_count: number }> {
  const today = new Date().toISOString().slice(0, 10)

  // 既に受取済みかチェック
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from(T.gachaDailyBonus)
    .select('user_id')
    .eq('user_id', USER_ID)
    .eq('given_date', today)
    .maybeSingle()
  if (existingErr) throw existingErr
  if (existing) {
    return { granted: false, ticket_count: await fetchTicketCount() }
  }

  // 受取記録を先に作り、同時クリックでも1回だけ付与されるようにする
  const { error: bonusErr } = await supabaseAdmin
    .from(T.gachaDailyBonus)
    .insert({ user_id: USER_ID, given_date: today })
  if (bonusErr) {
    if (bonusErr.code === '23505') {
      return { granted: false, ticket_count: await fetchTicketCount() }
    }
    throw bonusErr
  }

  // チケット +1
  const { data: count, error: rpcErr } = await supabaseAdmin.rpc('grant_gacha_ticket', {
    p_user_id: USER_ID,
    p_amount:  1,
  })
  if (rpcErr) {
    await supabaseAdmin
      .from(T.gachaDailyBonus)
      .delete()
      .eq('user_id', USER_ID)
      .eq('given_date', today)
    throw rpcErr
  }

  return { granted: true, ticket_count: Number(count ?? 0) }
}

// 質スコア配布（/api/chat から呼ぶ）
// score 1-2: 5%, 3-4: 15%, 5+: 30%
// 1 日上限 5 枚を超えたら配布しない。
export async function tryGrantTicketByScore(score: number): Promise<{ granted: boolean; ticket_count: number }> {
  const today = new Date().toISOString().slice(0, 10)

  // 本日の獲得数
  const { data: quota, error: quotaErr } = await supabaseAdmin
    .from(T.gachaDailyQuota)
    .select('earned_today')
    .eq('user_id', USER_ID)
    .eq('given_date', today)
    .maybeSingle()
  throwIfSupabaseError('fetch daily quota failed', quotaErr)
  const earned = quota?.earned_today ?? 0
  if (earned >= 5) {
    return { granted: false, ticket_count: await fetchTicketCount() }
  }

  // 確率判定
  const probability = score >= 5 ? 0.30 : score >= 3 ? 0.15 : 0.05
  if (secureRandom() >= probability) {
    return { granted: false, ticket_count: await fetchTicketCount() }
  }

  // チケット +1
  const { data: count, error: rpcErr } = await supabaseAdmin.rpc('grant_gacha_ticket', {
    p_user_id: USER_ID,
    p_amount:  1,
  })
  if (rpcErr) throw rpcErr

  // 本日の獲得数 +1
  const { error: updateQuotaErr } = await supabaseAdmin
    .from(T.gachaDailyQuota)
    .upsert({
      user_id: USER_ID,
      given_date: today,
      earned_today: earned + 1,
    }, { onConflict: 'user_id,given_date' })
  throwIfSupabaseError('update daily quota failed', updateQuotaErr)

  return { granted: true, ticket_count: Number(count ?? 0) }
}
