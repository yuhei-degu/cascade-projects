import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase      = createClient(url, anon)
export const supabaseAdmin = createClient(url, svc)

// テーブル名定数（既存 PJ への相乗りで shin_ プレフィックス付き）
export const T = {
  users:      'shin_users',
  messages:   'shin_messages',
  memories:   'shin_memories',
  charStates: 'shin_character_states',
  trigCache:  'shin_trigger_cache',
} as const
