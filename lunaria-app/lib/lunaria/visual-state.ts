import type { LunariaReactionId } from './reactions'

export const LUNARIA_EXPRESSIONS = [
  'normal',
  'smile',
  'gentle_smile',
  'teasing',
  'surprised',
  'thinking',
  'sad',
  'serious',
  'embarrassed',
  'sleepy',
  'excited',
  'relieved',
] as const

export const LUNARIA_MOTIONS = [
  'idle',
  'tilt_head',
  'nod',
  'shake_head',
  'look_away',
  'lean_forward',
  'close_eyes',
  'small_wave',
  'arms_crossed',
  'soft_laugh',
] as const

export type LunariaExpression = (typeof LUNARIA_EXPRESSIONS)[number]
export type LunariaMotion = (typeof LUNARIA_MOTIONS)[number]

export interface LunariaVisualState {
  outfitId?: string | null
  reaction?: LunariaReactionId | null
  expression?: LunariaExpression | string | null
  motion?: LunariaMotion | string | null
  imageUrl?: string | null
}

export function isLunariaExpression(value: unknown): value is LunariaExpression {
  return typeof value === 'string' && LUNARIA_EXPRESSIONS.includes(value as LunariaExpression)
}

export function isLunariaMotion(value: unknown): value is LunariaMotion {
  return typeof value === 'string' && LUNARIA_MOTIONS.includes(value as LunariaMotion)
}
