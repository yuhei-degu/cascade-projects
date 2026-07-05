import type { Emotion } from './types'
import { DEFAULT_EMOTION } from './types'
import { supabaseAdmin } from '../supabase'

const T = { emotion: 'lunaria_emotion_state' } as const

// 軸ごとの減衰率（睡眠トリガー時に適用）
// 怒りは早く冷め、孤独・不安は長く残る
const DECAY_RATES: Record<keyof Emotion, number> = {
  joy:        0.70,
  anger:      0.45,
  sadness:    0.75,
  shyness:    0.35,
  loneliness: 0.85,
  anxiety:    0.80,
}

// ベースライン（平熱）
const BASELINE: Emotion = {
  joy: 1, anger: 0, sadness: 1, shyness: 0, loneliness: 2, anxiety: 1,
}

// 日付を跨いだ場合に感情を平熱方向へ減衰させる
export async function applySleepDecay(userId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from(T.emotion)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return

  const lastDate = new Date(data.updated_at).toDateString()
  const today    = new Date().toDateString()
  if (lastDate === today) return  // 同日はスキップ

  const next: Record<string, number> = {}
  for (const key of Object.keys(BASELINE) as Array<keyof Emotion>) {
    next[key] = Math.round(
      BASELINE[key] + (data[key] - BASELINE[key]) * DECAY_RATES[key]
    )
  }

  await supabaseAdmin.from(T.emotion).update({
    ...next, updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
}

// 抽出結果の感情値でDBを更新（会話ごと）
export async function updateEmotion(extracted: Emotion, userId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from(T.emotion).select('*').eq('user_id', userId).single()

  const current: Emotion = data ?? DEFAULT_EMOTION

  // 抽出値と現在値の加重平均（現在値70% + 新規30%）
  const next: Record<string, number> = {}
  for (const key of Object.keys(current) as Array<keyof Emotion>) {
    next[key] = Math.round(current[key] * 0.7 + extracted[key] * 0.3)
  }

  await supabaseAdmin.from(T.emotion).upsert({
    user_id: userId, ...next, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function getEmotion(userId: string): Promise<Emotion> {
  const { data } = await supabaseAdmin
    .from(T.emotion).select('*').eq('user_id', userId).single()
  return data ?? DEFAULT_EMOTION
}
