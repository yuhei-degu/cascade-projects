import { z } from 'zod'

// ── 感情値 ───────────────────────────────────────────────────
export const EmotionSchema = z.object({
  joy:        z.number().min(0).max(10),
  anger:      z.number().min(0).max(10),
  sadness:    z.number().min(0).max(10),
  shyness:    z.number().min(0).max(10),
  loneliness: z.number().min(0).max(10),
  anxiety:    z.number().min(0).max(10),
})
export type Emotion = z.infer<typeof EmotionSchema>

export const DEFAULT_EMOTION: Emotion = {
  joy: 1, anger: 0, sadness: 1, shyness: 0, loneliness: 2, anxiety: 1,
}

// ── Gemini 抽出結果 ──────────────────────────────────────────
export const ExtractionSchema = z.object({
  summary:               z.string(),
  emotions:              EmotionSchema,
  importance_score:      z.number().min(1).max(5),
  self_disclosure_depth: z.number().min(0).max(3),
  affinity_delta:        z.number().min(0).max(5),
  status_updates:        z.array(z.object({
    type:  z.enum(['job', 'relationship', 'goal', 'other']),
    value: z.string(),
  })).default([]),
  unresolved_issues:     z.array(z.string()).default([]),
  long_term_candidate:   z.object({
    type:    z.enum(['value', 'pattern', 'goal', 'trigger']),
    content: z.string(),
  }).nullable().default(null),
})
export type Extraction = z.infer<typeof ExtractionSchema>

// ── 親密度 ───────────────────────────────────────────────────
export const AffinitySchema = z.object({
  bond_score:      z.number().default(0),
  closeness_level: z.number().min(0).max(100).default(0),
  unlock_casual:   z.boolean().default(false),
  unlock_honest:   z.boolean().default(false),
  unlock_secret:   z.boolean().default(false),
})
export type Affinity = z.infer<typeof AffinitySchema>

// ── 日記 ─────────────────────────────────────────────────────
export const DiarySchema = z.object({
  summary:           z.string(),
  events:            z.array(z.string()),
  emotions:          EmotionSchema,
  luna_comment:      z.string(),
  unresolved_issues: z.array(z.string()),
  next_topics:       z.array(z.string()),
  importance:        z.number().min(1).max(5),
})
export type Diary = z.infer<typeof DiarySchema>

// ── ルーティング ─────────────────────────────────────────────
export type RouteType = 'light_normal' | 'light_probe' | 'claude_serious'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}
