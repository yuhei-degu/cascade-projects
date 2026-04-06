// ── types.ts ─────────────────────────────────────────────────

export type RouteType = 'light_normal' | 'light_probe' | 'claude_serious'
export type MemType = 'value' | 'pattern' | 'goal' | 'trigger' | 'mid'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
  route?: RouteType
}

export interface Memory {
  session: Message[]          // 直近20発言
  core: CoreMemoryItem[]      // 長期記憶
}

export interface CoreMemoryItem {
  id: number
  type: MemType
  content: string
  ts: number
  score: number               // 1-5
  hitCount: number            // 何セッションで登場したか
}

export interface ScoreState {
  // 直近5件のユーザー発言スコア（window計算用）
  recentScores: number[]
  heavySignalCount: number
  lastRouteType: RouteType
  lastSeriousAt: number       // claude_serious の最終発生時刻
}

export interface ChatRequest {
  userId: string
  message: string
  memory: Memory
  scoreState: ScoreState
  history: Message[]
}

export interface ChatResponse {
  message: string
  routeType: RouteType
  scoreState: ScoreState
  memory: Memory
  emotionTag?: string         // claude_serious 時のみ
}

// Claude からの JSON レスポンス形式
export interface ClaudeResponse {
  message: string
  emotion: 'neutral' | 'empathy' | 'concern' | 'warm' | 'serious'
  intensity: 1 | 2 | 3
  extract: {
    type: MemType | null
    content: string | null
    hitCount?: number
  }
}
