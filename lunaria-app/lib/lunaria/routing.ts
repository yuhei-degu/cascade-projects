import type { RouteType } from './types'

// window_score 累積判定（現行設計を継承）
const KEYWORDS = {
  heavy: ['死にたい', 'もう無理', '消えたい', '限界', 'つらい'],
  serious4: ['迷ってる', '相談', 'どうしたら', '辞める', '辞めよう'],
  probe2: ['最近', 'ずっと', '疲れ', 'しんどい'],
}

export function calcMessageScore(text: string): number {
  if (KEYWORDS.heavy.some(w => text.includes(w)))   return 6
  if (KEYWORDS.serious4.some(w => text.includes(w))) return 4
  if (text.length >= 80)                             return 2
  if (KEYWORDS.probe2.some(w => text.includes(w)))   return 1
  return 0
}

export interface RouteResult {
  routeType:    RouteType
  msgScore:     number
  windowScore:  number
  heavyCount:   number
  prevScores:   number[]
}

export function calcRoute(
  text: string,
  prevScores: number[],
  prevHeavyCount: number,
): RouteResult {
  const msgScore   = calcMessageScore(text)
  const newScores  = [...prevScores, msgScore].slice(-5)
  const windowScore = newScores.reduce((s, n) => s + n, 0)
  const isHeavy    = msgScore >= 4 || text.length >= 80
  const heavyCount = isHeavy ? prevHeavyCount + 1 : prevHeavyCount

  let routeType: RouteType
  if (heavyCount >= 2 || windowScore >= 8) routeType = 'claude_serious'
  else if (windowScore >= 4)               routeType = 'light_probe'
  else                                     routeType = 'light_normal'

  return { routeType, msgScore, windowScore, heavyCount, prevScores: newScores }
}

// light_probe テンプレート
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
