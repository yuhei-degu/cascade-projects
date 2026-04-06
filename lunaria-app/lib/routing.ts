import type { RouteType, ScoreState } from './types'

// ── SPEC.md ルーティング設計の完全実装 ─────────────────────────

const PROBE_KEYWORDS   = ['最近', 'ずっと', '迷ってる', '迷う', 'どうしよう', '相談']
const CONSULT_KEYWORDS = ['相談', '教えて', 'どう思う', 'どうしたら', 'アドバイス']
const DECISION_KEYWORDS= ['辞める', '辞めよう', '変える', '決める', '決断', '選ぶ']
const HEAVY_WORDS      = ['死にたい', 'もう無理', '消えたい', '消えよう', 'つらい', '限界']

export function calcMessageScore(text: string): number {
  // 絶対シグナル（最優先）
  if (HEAVY_WORDS.some(w => text.includes(w)))     return 6
  // 決断系
  if (DECISION_KEYWORDS.some(w => text.includes(w))) return 6
  // 相談明示
  if (CONSULT_KEYWORDS.some(w => text.includes(w))) return 4
  // 継続・probe 系
  if (PROBE_KEYWORDS.some(w => text.includes(w)))  return 4
  // 長文ネガティブ（80文字以上 + ネガワード）
  const NEG_WORDS = ['しんどい', '疲れ', 'きつい', 'つらい', 'しんどい', '不安', '心配']
  if (text.length >= 80 && NEG_WORDS.some(w => text.includes(w))) return 4
  // 弱いネガティブ
  if (NEG_WORDS.some(w => text.includes(w)))       return 2
  // 軽い感情・ぼやき
  const MILD = ['疲れた', 'めんどい', 'だるい', 'やる気', '眠い', '眠たい']
  if (MILD.some(w => text.includes(w)))             return 1
  return 0
}

function calcWindowScore(scores: number[]): number {
  return scores.reduce((s, n) => s + n, 0)
}

function isHeavySignal(text: string, score: number): boolean {
  if (score >= 4) return true
  if (text.length >= 80 && score >= 2) return true
  if (DECISION_KEYWORDS.some(w => text.includes(w))) return true
  return false
}

const COOLDOWN_MS = 15 * 60 * 1000 // 15分

export function calcRoute(
  text: string,
  state: ScoreState,
): { routeType: RouteType; newState: ScoreState } {
  const msgScore   = calcMessageScore(text)
  const newScores  = [...state.recentScores, msgScore].slice(-5)
  const winScore   = calcWindowScore(newScores)
  const heavy      = isHeavySignal(text, msgScore)
  const newHeavy   = heavy ? state.heavySignalCount + 1 : state.heavySignalCount

  // 強制 claude_serious（絶対シグナル）
  if (newHeavy >= 2) {
    return {
      routeType: 'claude_serious',
      newState: { recentScores: newScores, heavySignalCount: newHeavy, lastRouteType: 'claude_serious', lastSeriousAt: Date.now() },
    }
  }

  // クールダウン中は light_probe 上限
  const inCooldown = Date.now() - state.lastSeriousAt < COOLDOWN_MS

  let routeType: RouteType
  if (winScore >= 8 && !inCooldown)      routeType = 'claude_serious'
  else if (winScore >= 4 || inCooldown)  routeType = 'light_probe'
  else                                    routeType = 'light_normal'

  return {
    routeType,
    newState: {
      recentScores: newScores,
      heavySignalCount: newHeavy,
      lastRouteType: routeType,
      lastSeriousAt: routeType === 'claude_serious' ? Date.now() : state.lastSeriousAt,
    },
  }
}

export const DEFAULT_SCORE_STATE: ScoreState = {
  recentScores: [],
  heavySignalCount: 0,
  lastRouteType: 'light_normal',
  lastSeriousAt: 0,
}

// ── confidence スコア計算（0〜1）─────────────────────────────
// window_scoreが閾値から離れているほど確信度が高い
export function calcConfidence(winScore: number, heavyCount: number): number {
  if (heavyCount >= 2) return 0.97
  if (winScore >= 10)  return 0.92
  if (winScore >= 8)   return 0.80
  if (winScore >= 6)   return 0.65
  if (winScore >= 4)   return 0.55
  if (winScore <= 1)   return 0.88
  return 0.60
}

// ── candidate_routes（判定候補一覧）──────────────────────────
export function buildCandidateRoutes(winScore: number, heavyCount: number) {
  if (heavyCount >= 2) return [
    { route: 'claude_serious', score: 0.97 },
    { route: 'light_probe',    score: 0.03 },
  ]
  if (winScore >= 8) return [
    { route: 'claude_serious', score: 0.80 },
    { route: 'light_probe',    score: 0.18 },
    { route: 'light_normal',   score: 0.02 },
  ]
  if (winScore >= 4) return [
    { route: 'light_probe',    score: 0.65 },
    { route: 'claude_serious', score: 0.25 },
    { route: 'light_normal',   score: 0.10 },
  ]
  return [
    { route: 'light_normal',   score: 0.88 },
    { route: 'light_probe',    score: 0.10 },
    { route: 'claude_serious', score: 0.02 },
  ]
}
