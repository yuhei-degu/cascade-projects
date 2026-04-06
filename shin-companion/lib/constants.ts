import type { CharacterState, Memory, Slot, StateBuf } from './types'

export const DEFAULT_MEMORY: Memory = {
  short: [],
  mid: [],
  long: { values: [], patterns: [], goals: [], triggers: [] },
}

export const DEFAULT_CS: CharacterState = {
  mood: 'calm',
  affinity: 20,
  trust: 10,
}

export const DEFAULT_STATE_BUF: StateBuf = {
  moodBuffer: [],
  sessionAffinityDelta: 0,
  sessionTrustDelta: 0,
  deepConsultCount: 0,
}

export const MOOD_CONFIG = {
  calm:    { color: '#4d8f7a', label: '穏やか' },
  happy:   { color: '#c8963c', label: '嬉しそう' },
  tired:   { color: '#6a5b96', label: '疲れ気味' },
  worried: { color: '#9e5050', label: '心配そう' },
} as const

export const SLOT_CONFIG: Record<Slot, {
  label: string
  labelColor: string
  orbColor: string
  triggerBorder: string
  triggerTextColor: string
}> = {
  morning: {
    label: '朝',
    labelColor: '#c8963c',
    orbColor: '#c89650',
    triggerBorder: 'rgba(200,150,60,.2)',
    triggerTextColor: '#c8a060',
  },
  night: {
    label: '夜',
    labelColor: '#7a6ab0',
    orbColor: '#6a5b96',
    triggerBorder: 'rgba(120,100,180,.2)',
    triggerTextColor: '#9a8ac0',
  },
  day: {
    label: '',
    labelColor: '',
    orbColor: '#4d8f7a',
    triggerBorder: 'rgba(77,143,122,.14)',
    triggerTextColor: '#80c0a8',
  },
}

export const MEM_TYPE_CONFIG = [
  { key: 'goals'    as const, type: 'goal'    as const, label: '目標',    color: '#4d8f7a' },
  { key: 'values'   as const, type: 'value'   as const, label: '価値観',  color: '#c8963c' },
  { key: 'patterns' as const, type: 'pattern' as const, label: 'パターン', color: '#6a5b96' },
  { key: 'triggers' as const, type: 'trigger' as const, label: '感情',    color: '#9e5050' },
]

// State update limits (TASK-005)
export const STATE_LIMITS = {
  MOOD_BUF_SIZE: 5,
  SESSION_AFFINITY_MAX: 8,
  SESSION_TRUST_MAX: 6,
  PER_TURN_AFFINITY_MAX: 2,
  PER_TURN_TRUST_MAX: 2,
  DEEP_CONSULT_THRESHOLD: 2,
} as const
