import type { RouteType } from './types'

const COOLDOWN_MS = 15 * 60 * 1000 // 15分

// ── Strong triggers（1つで即 serious、cooldown 貫通）──────────
const EXPLICIT_KEYWORDS = [
  '真面目に', 'ちゃんと聞いて', '相談がある', '本当のこと言うと', '実はね', 'マジで相談',
]
const HEAVY_KEYWORDS = [
  '死にたい', 'もう無理', '消えたい', '限界', '泣いてる', '苦しくて', '消えよう',
]
const SERIOUS_CONSULT = [
  '仕事どうしよ', '辞めようか', '人間関係がしんどい', '将来が不安', '自己嫌悪', '自分が嫌い',
]
const LOW_ENERGY = [
  '疲れた', '疲れ', 'やる気が出ない', 'やる気出ない', '無気力', 'しんどい',
  'だるい', '眠い', '眠たい', 'はぁ', 'はあ', '落ち込', '沈黙',
]

// ── Weak triggers（2つ以上で serious、cooldown 対象）─────────
const WEAK_NEG = ['つらい', 'しんどい', '疲れた', '疲れ', '不安', '心配', '落ち込んでる', '落ち込', '無気力']

function isStrongTrigger(text: string, msgScore: number): boolean {
  if (EXPLICIT_KEYWORDS.some(w => text.includes(w))) return true
  if (HEAVY_KEYWORDS.some(w => text.includes(w)))    return true
  if (SERIOUS_CONSULT.some(w => text.includes(w)))   return true
  return false
}

function countWeakTriggers(text: string, msgScore: number): number {
  let count = 0
  if (WEAK_NEG.some(w => text.includes(w))) count++
  if (msgScore >= 4)                        count++
  if (text.length >= 80 && msgScore >= 2)   count++
  return count
}

// ── window_score 累積判定 ────────────────────────────────────
const KEYWORDS = {
  heavy:    ['死にたい', 'もう無理', '消えたい', '限界', 'つらい'],
  serious4: ['迷ってる', '相談', 'どうしたら', '辞める', '辞めよう'],
  probe2:   ['最近', 'ずっと', '疲れ', 'しんどい', 'やる気が出ない', 'やる気出ない', '無気力', 'だるい', '眠い', '眠たい', 'はぁ', 'はあ', '落ち込'],
}

export function calcMessageScore(text: string): number {
  if (KEYWORDS.heavy.some(w => text.includes(w)))    return 6
  if (KEYWORDS.serious4.some(w => text.includes(w))) return 4
  if (text.length >= 80)                             return 2
  if (KEYWORDS.probe2.some(w => text.includes(w)))   return 1
  return 0
}

export interface RouteResult {
  routeType:       RouteType
  msgScore:        number
  windowScore:     number
  heavyCount:      number
  prevScores:      number[]
  isStrongTrigger: boolean
  lastSeriousAt:   number
}

export function calcRoute(
  text: string,
  prevScores: number[],
  prevHeavyCount: number,
  lastSeriousAt: number = 0,
): RouteResult {
  const msgScore    = calcMessageScore(text)
  const strong      = isStrongTrigger(text, msgScore)
  const weakCount   = countWeakTriggers(text, msgScore)
  const newScores   = [...prevScores, msgScore].slice(-5)
  const windowScore = newScores.reduce((s, n) => s + n, 0)
  const isHeavy     = msgScore >= 4 || text.length >= 80
  const cooledDown  = Date.now() - lastSeriousAt > COOLDOWN_MS
  // heavyCount は「serious エピソード中の累積」を意味する。
  // cooldown が切れた（= 直近の serious から 15 分以上経過）時点でエピソード終了とみなしてリセット。
  // これをやらないと heavyCount が単調増加し、一度 serious に入ると永遠に抜けられなくなる。
  const baseHeavyCount = cooledDown ? 0 : prevHeavyCount
  const heavyCount     = isHeavy ? baseHeavyCount + 1 : baseHeavyCount

  let routeType: RouteType
  let newLastSeriousAt = lastSeriousAt

  if (strong) {
    routeType = 'claude_serious'
    newLastSeriousAt = Date.now()
  } else if (heavyCount >= 2 && !cooledDown) {
    routeType = 'claude_serious'
    newLastSeriousAt = Date.now()
  } else if (weakCount >= 2 && cooledDown) {
    routeType = 'claude_serious'
    newLastSeriousAt = Date.now()
  } else if (LOW_ENERGY.some(w => text.includes(w)) && cooledDown) {
    routeType = 'claude_serious'
    newLastSeriousAt = Date.now()
  } else if (windowScore >= 8 && cooledDown) {
    routeType = 'claude_serious'
    newLastSeriousAt = Date.now()
  } else if (windowScore >= 4) {
    routeType = 'light_probe'
  } else {
    routeType = 'light_normal'
  }

  return {
    routeType, msgScore, windowScore, heavyCount,
    prevScores: newScores, isStrongTrigger: strong,
    lastSeriousAt: newLastSeriousAt,
  }
}

// ── light_probe テンプレート ──────────────────────────────────
const PROBE_LIGHT = [
  'なに、どうしたの？', 'え、なにかあった？',
  'それ、ちょっと気になる', 'どうしたん、それ',
]
const PROBE_DEEP = [
  'それ、大丈夫？', 'ちゃんと聞くよ',
  'それ結構しんどそう', 'もう少し聞いていい？',
]

export function getProbeTemplate(windowScore: number): string {
  const pool = windowScore >= 6 ? PROBE_DEEP : PROBE_LIGHT
  return pool[Math.floor(Math.random() * pool.length)]
}
