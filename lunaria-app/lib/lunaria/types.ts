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

// ── 作業抽出（work items / ピボット Phase 1） ─────────────────
export const WORK_ITEM_KINDS = ['did', 'done', 'stuck', 'decided', 'next'] as const
export type WorkItemKind = (typeof WORK_ITEM_KINDS)[number]

export const WorkItemSchema = z.object({
  kind:    z.enum(WORK_ITEM_KINDS),
  content: z.string(),
  project: z.string().nullable().default(null),
})
export type WorkItem = z.infer<typeof WorkItemSchema>

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
  work_items:            z.array(WorkItemSchema).default([]),
  long_term_candidate:   z.object({
    type:    z.enum(['value', 'pattern', 'goal', 'trigger', 'name']),
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
  title:             z.string().default(''),
  summary:           z.string(),
  events:            z.array(z.string()),
  talked_about:      z.array(z.string()).default([]),
  emotions:          EmotionSchema,
  luna_comment:      z.string(),
  unresolved_issues: z.array(z.string()),
  next_topics:       z.array(z.string()),
  memory_changes:    z.array(z.object({
    type:                 z.string().default('other'),
    content:              z.string(),
    action:               z.enum(['candidate', 'saved', 'confirmed']).default('candidate'),
    source_message_count: z.number().int().min(0).default(0),
  })).default([]),
  importance:        z.number().min(1).max(5),
  source_message_count: z.number().int().min(0).default(0),
  generated_at:      z.string().nullable().default(null),
})
export type Diary = z.infer<typeof DiarySchema>

// ── ルーティング ─────────────────────────────────────────────
export type RouteType = 'light_normal' | 'light_probe' | 'claude_serious'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

// ── 話題転換ロジック ─────────────────────────────────────────
export type TopicCategory =
  | 'work' | 'health' | 'meal' | 'hobby' | 'relation'
  | 'future' | 'daily_event' | 'money' | 'self_image' | 'sleep' | 'other'

export interface TurnTopicExtraction {
  summary:              string
  emotions:             string[]
  current_topic:        TopicCategory
  subtopic:             string
  topic_depth:          1 | 2 | 3 | 4 | 5
  novelty:              0 | 1 | 2
  needs_followup:       boolean
  user_initiated_shift: boolean
  intent:               'clarify_first' | 'answer_directly'
  clarifying_question:  string
}

export const FALLBACK_TOPIC: TurnTopicExtraction = {
  summary: '', emotions: [], current_topic: 'other',
  subtopic: 'unknown', topic_depth: 1, novelty: 1,
  needs_followup: false, user_initiated_shift: false,
  intent: 'answer_directly', clarifying_question: '',
}

export type ConversationMode = 'deepen' | 'continue' | 'shift_soft'

export interface DailyCoverageState {
  work:           boolean
  health:         boolean
  meal:           boolean
  relation:       boolean
  hobby:          boolean
  tomorrow:       boolean
  small_positive: boolean
}

export const DEFAULT_COVERAGE: DailyCoverageState = {
  work: false, health: false, meal: false,
  relation: false, hobby: false, tomorrow: false, small_positive: false,
}

export interface TopicCluster {
  topic:           string
  subtopic:        string
  count:           number
  emotionalWeight: number
}
