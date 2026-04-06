// ── types/index.ts ─────────────────────────────────────────

export type Mood = 'calm' | 'happy' | 'tired' | 'worried'
export type MemType = 'value' | 'pattern' | 'goal' | 'trigger' | 'mid'
export type Slot = 'morning' | 'day' | 'night'

export interface Memory {
  short: ShortMemItem[]
  mid: string[]
  long: {
    values: string[]
    patterns: string[]
    goals: string[]
    triggers: string[]
  }
}

export interface ShortMemItem {
  role: 'user' | 'assistant'
  content: string
}

export interface MemMeta {
  id: number
  type: MemType
  content: string
  ts: number
  score: number // 1–5
}

export interface CharacterState {
  mood: Mood
  affinity: number // 0–100
  trust: number    // 0–100
}

export interface StateBuf {
  moodBuffer: Mood[]
  sessionAffinityDelta: number
  sessionTrustDelta: number
  deepConsultCount: number
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

// AI raw response shape
export interface AIResponse {
  message: string
  mood: Mood
  affinity_delta: number
  trust_delta: number
  extract: {
    type: MemType | null
    content: string | null
  }
}

export interface TriggerResponse {
  trigger: string
}
