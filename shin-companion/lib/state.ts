import type { CharacterState, Mood, StateBuf } from './types'
import { STATE_LIMITS } from './constants'

// TASK-005: mood 多数決
function calcMoodByVote(buffer: Mood[]): Mood {
  if (!buffer.length) return 'calm'
  const counts: Record<Mood, number> = { calm: 0, happy: 0, tired: 0, worried: 0 }
  for (const m of buffer) counts[m]++
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Mood)
}

interface DeltaResult {
  newCs: CharacterState
  newBufState: StateBuf
  changes: string[]
}

// TASK-005: 平滑化された状態更新
export function applyStateDelta(
  cs: CharacterState,
  buf: StateBuf,
  raw: { mood?: Mood; affinity_delta?: number; trust_delta?: number },
): DeltaResult {
  const {
    MOOD_BUF_SIZE, SESSION_AFFINITY_MAX, SESSION_TRUST_MAX,
    PER_TURN_AFFINITY_MAX, PER_TURN_TRUST_MAX, DEEP_CONSULT_THRESHOLD,
  } = STATE_LIMITS

  // 1. mood: buffer → majority vote
  const newBuf = [...buf.moodBuffer, raw.mood ?? cs.mood].slice(-MOOD_BUF_SIZE)
  const nextMood = calcMoodByVote(newBuf)

  // 2. affinity: per-turn clamp ±2, session cap ±8
  const adRaw = Math.max(-PER_TURN_AFFINITY_MAX, Math.min(PER_TURN_AFFINITY_MAX, raw.affinity_delta ?? 0))
  const adAllowed = adRaw > 0
    ? Math.min(adRaw, Math.max(0, SESSION_AFFINITY_MAX - buf.sessionAffinityDelta))
    : Math.max(adRaw, Math.min(0, -SESSION_AFFINITY_MAX - buf.sessionAffinityDelta))
  const newAffinity = Math.min(100, Math.max(0, cs.affinity + adAllowed))

  // 3. trust: 深い相談 (trust_delta≥2) が連続2回以上で本格上昇を解放
  const isDeep = (raw.trust_delta ?? 0) >= 2
  const newDeepCount = isDeep
    ? buf.deepConsultCount + 1
    : Math.max(0, buf.deepConsultCount - 1)
  const tdBase = newDeepCount >= DEEP_CONSULT_THRESHOLD
    ? Math.max(-PER_TURN_TRUST_MAX, Math.min(PER_TURN_TRUST_MAX, raw.trust_delta ?? 0))
    : Math.max(-1, Math.min(1, (raw.trust_delta ?? 0) > 0 ? 0 : (raw.trust_delta ?? 0)))
  const tdAllowed = tdBase > 0
    ? Math.min(tdBase, Math.max(0, SESSION_TRUST_MAX - buf.sessionTrustDelta))
    : Math.max(tdBase, Math.min(0, -SESSION_TRUST_MAX - buf.sessionTrustDelta))
  const newTrust = Math.min(100, Math.max(0, cs.trust + tdAllowed))

  const newCs: CharacterState = { mood: nextMood, affinity: newAffinity, trust: newTrust }
  const newBufState: StateBuf = {
    moodBuffer: newBuf,
    sessionAffinityDelta: buf.sessionAffinityDelta + adAllowed,
    sessionTrustDelta: buf.sessionTrustDelta + tdAllowed,
    deepConsultCount: newDeepCount,
  }

  const changes: string[] = []
  if (nextMood !== cs.mood) changes.push(`mood: ${cs.mood}→${nextMood}`)
  if (adAllowed !== 0) changes.push(`affinity: ${adAllowed > 0 ? '+' : ''}${Math.round(adAllowed)}`)
  if (tdAllowed !== 0) changes.push(`trust: ${tdAllowed > 0 ? '+' : ''}${Math.round(tdAllowed)}`)

  return { newCs, newBufState, changes }
}
