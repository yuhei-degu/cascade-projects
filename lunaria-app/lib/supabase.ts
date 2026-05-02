import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase      = createClient(url, anon)
export const supabaseAdmin = createClient(url, svc)

// テーブル名（lunaria_ prefix で Certi-AI Hub に相乗り）
export const T = {
  users:         'lunaria_users',
  messages:      'lunaria_messages',
  session:       'lunaria_session',
  coreMem:       'lunaria_core_memory',
  routingLog:    'lunaria_routing_log',
  routingReview: 'lunaria_routing_review',
  routeMaster:   'lunaria_route_master',
  // Phase G: ガチャ関連
  gachaPool:        'lunaria_gacha_pool',
  gachaTickets:     'lunaria_gacha_tickets',
  gachaCoins:       'lunaria_gacha_coins',
  gachaInventory:   'lunaria_gacha_inventory',
  gachaHistory:     'lunaria_gacha_history',
  gachaDailyBonus:  'lunaria_gacha_daily_bonus',
  gachaDailyQuota:  'lunaria_gacha_daily_quota',
  gachaPityState:   'lunaria_gacha_pity_state',
} as const
