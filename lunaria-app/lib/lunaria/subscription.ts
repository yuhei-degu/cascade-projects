import { supabaseAdmin } from '../supabase'

export type Plan = 'free' | 'premium'

const USER_ID = '00000000-0000-0000-0000-000000000001'

/** フリープランで記憶を保持する日数 */
const FREE_MEMORY_DAYS = 7

// ── プラン取得 ────────────────────────────────────────────────
export async function getUserPlan(userId: string = USER_ID): Promise<Plan> {
  const { data } = await supabaseAdmin
    .from('lunaria_users')
    .select('plan')
    .eq('id', userId)
    .single()

  return ((data as any)?.plan ?? 'free') as Plan
}

// ── フリープラン記憶スコア減衰 ────────────────────────────────
// 7日以上前に最後に参照された core_memory のスコアを -1 する（最小1）
// profile 系（user_name / user_gender など）はスコア変動対象外
export async function applyFreeMemoryDecay(userId: string = USER_ID): Promise<void> {
  const plan = await getUserPlan(userId)
  if (plan === 'premium') return

  const sevenDaysAgo = new Date(
    Date.now() - FREE_MEMORY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { data: oldMemories } = await supabaseAdmin
    .from('lunaria_core_memory')
    .select('id, score, memory_category')
    .eq('user_id', userId)
    .lte('last_seen', sevenDaysAgo)
    .neq('memory_category', 'profile') // プロフィール系は対象外
    .gt('score', 1)

  if (!oldMemories || oldMemories.length === 0) return

  for (const mem of oldMemories) {
    await supabaseAdmin
      .from('lunaria_core_memory')
      .update({ score: (mem as any).score - 1 })
      .eq('id', (mem as any).id)
  }

  console.log(`[subscription] free plan decay: ${oldMemories.length} memories degraded`)
}

// ── 記憶フェードヒント（課金フック）─────────────────────────
// フリープランで5〜7日前の記憶が存在する場合に自然な一言を返す
// ルナリアが「薄れてきた気がする」と言うことで有料プランへの関心を誘起する
const FADE_HINTS = [
  'なんか、最近のこと…だいぶ薄れてきた気がする。',
  'ちょっと前のこと、うまく思い出せなくなってきたかも…。',
  'あれ、最近の話ってどんな感じだったっけ…なんか霞んでる気がして。',
]

export async function getMemoryFadeHint(userId: string = USER_ID): Promise<string | null> {
  const plan = await getUserPlan(userId)
  if (plan === 'premium') return null

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(
    Date.now() - FREE_MEMORY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  // 5〜7日前に見た記憶が存在するか（まだスコアが残っているもの）
  const { data: fadingMems } = await supabaseAdmin
    .from('lunaria_core_memory')
    .select('id')
    .eq('user_id', userId)
    .lte('last_seen', fiveDaysAgo)
    .gte('last_seen', sevenDaysAgo)
    .neq('memory_category', 'profile')
    .gt('score', 1)
    .limit(1)

  if (!fadingMems || fadingMems.length === 0) return null

  return FADE_HINTS[Math.floor(Math.random() * FADE_HINTS.length)]
}
