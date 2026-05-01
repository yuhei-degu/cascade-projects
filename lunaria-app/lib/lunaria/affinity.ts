import type { Affinity } from './types'
import { supabaseAdmin } from '../supabase'

const USER_ID = '00000000-0000-0000-0000-000000000001'
const T = { affinity: 'lunaria_affinity' } as const

// 親密度を加算して閾値チェック（日次バッチで呼ぶ）
export async function updateAffinity(delta: number): Promise<Affinity> {
  const { data } = await supabaseAdmin
    .from(T.affinity).select('*').eq('user_id', USER_ID).single()

  const current: Affinity = data ?? {
    bond_score: 0, closeness_level: 0,
    unlock_casual: false, unlock_honest: false, unlock_secret: false,
  }

  const newBond     = current.bond_score + delta
  const newCloseness = Math.min(100, current.closeness_level + delta)

  const updated: Affinity = {
    bond_score:      newBond,
    closeness_level: newCloseness,
    unlock_casual:   newCloseness >= 30,
    unlock_honest:   newCloseness >= 60,
    unlock_secret:   newCloseness >= 80,
  }

  await supabaseAdmin.from(T.affinity).upsert({
    user_id: USER_ID, ...updated, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return updated
}

export async function getAffinity(): Promise<Affinity> {
  const { data } = await supabaseAdmin
    .from(T.affinity).select('*').eq('user_id', USER_ID).single()
  return data ?? {
    bond_score: 0, closeness_level: 0,
    unlock_casual: false, unlock_honest: false, unlock_secret: false,
  }
}
