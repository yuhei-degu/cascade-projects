import { z } from 'zod'

export const ASSISTANT_EMOTIONS = [
  'warm',
  'playful',
  'sad',
  'serious',
  'calm',
  'surprised',
  'relieved',
  'worried',
] as const

export const ASSISTANT_VOICE_TONES = [
  'soft',
  'firm',
  'playful',
  'sleepy',
  'bright',
  'quiet',
] as const

export const AssistantReplySchema = z.object({
  message: z.string().min(1),
  emotion: z.enum(ASSISTANT_EMOTIONS).optional(),
  expression: z.string().min(1).optional(),
  motion: z.string().min(1).optional(),
  voice_tone: z.enum(ASSISTANT_VOICE_TONES).optional(),
  topic_tags: z.array(z.string().min(1)).max(12).optional(),
  should_create_memory_candidate: z.boolean().optional(),
  should_create_diary_candidate: z.boolean().optional(),
})

export type AssistantEmotion = (typeof ASSISTANT_EMOTIONS)[number]
export type AssistantVoiceTone = (typeof ASSISTANT_VOICE_TONES)[number]
export type AssistantReply = z.infer<typeof AssistantReplySchema>

export function parseAssistantReply(raw: unknown): AssistantReply {
  if (typeof raw !== 'string') {
    const result = AssistantReplySchema.safeParse(raw)
    if (result.success) return normalizeAssistantReply(result.data)
    return { message: String(raw ?? '') }
  }

  const trimmed = raw.trim()
  if (!trimmed) return { message: '' }

  const parsedJson = tryParseJson(trimmed)
  if (parsedJson.ok) {
    const result = AssistantReplySchema.safeParse(parsedJson.value)
    if (result.success) return normalizeAssistantReply(result.data)
  }

  return { message: raw }
}

export function stringifyAssistantMessage(reply: AssistantReply): string {
  return reply.message
}

function normalizeAssistantReply(reply: AssistantReply): AssistantReply {
  return {
    ...reply,
    message: reply.message.trim(),
    topic_tags: reply.topic_tags?.map(tag => tag.trim()).filter(Boolean).slice(0, 12),
  }
}

function tryParseJson(value: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) }
  } catch {
    return { ok: false }
  }
}
