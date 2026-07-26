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

const MAX_NEXT_STEP_CHARS = 160
const MAX_VISUAL_CUE_CHARS = 48

export const AssistantReplySchema = z.object({
  message: z.string().min(1),
  emotion: z.enum(ASSISTANT_EMOTIONS).optional(),
  expression: z.string().min(1).optional(),
  motion: z.string().min(1).optional(),
  voice_tone: z.enum(ASSISTANT_VOICE_TONES).optional(),
  topic_tags: z.array(z.string().min(1)).optional(),
  next_step: z.string().min(1).optional(),
  should_create_memory_candidate: z.boolean().optional(),
  should_create_diary_candidate: z.boolean().optional(),
})

export type AssistantEmotion = (typeof ASSISTANT_EMOTIONS)[number]
export type AssistantVoiceTone = (typeof ASSISTANT_VOICE_TONES)[number]
export type AssistantReply = z.infer<typeof AssistantReplySchema>

// ── 思考プロセス漏れの後処理ガード ──────────────────────────
// gemini-2.5-flash は稀に思考(「思考プロセス:」「これでいこう。」等)を本文に
// 混ぜて返す(eval P3/edge-v2 で実測)。プロンプト禁止だけでは抑止できないため、
// メタ出力を検出したら終端マーカー以降の本文だけを取り出す。
const REASONING_LEAK_RE = /思考プロセス|【思考開始】|【思考終了】|試作\s*\d|回答の方針|回答案|構成案|最終チェック|最終案|最終的な返答|これで返信します|返答を作成|承知いたしました|として返答します|返答例|プラン：|話し方ルール|絶対規則|これでいく|これで良いだろう|^考え中|^PH:|^WILCO/m
const REASONING_END_MARKERS = [
  '【思考終了】',
  '返答例：', '返答例:',
  '最終的な返答：', '最終的な返答:', '最終案：', '最終案:',
  'これでいく。', 'これでいく！', 'よし、これでいこう。', 'これでいこう。',
  'これで良いだろう。', '完璧だ。', 'これで完璧だ。',
  'これで返信します。', 'この方針で返答を作成する。', '返答を作成する。',
]

export function stripLeakedReasoning(raw: string): string {
  let text = raw.trim()

  // 「引用＋同文リピート」形式（『「X」X』）は引用側を落とす
  const dup = text.match(/^「([\s\S]{10,})」\s*([\s\S]+)$/)
  if (dup && dup[1].trim() === dup[2].trim()) return dup[1].trim()

  if (!REASONING_LEAK_RE.test(text)) return raw

  // 水平線区切り（前置き\n---\n本文）は最後の区切り以降を本文とみなす
  const hrParts = text.split(/\n-{3,}\n/)
  if (hrParts.length > 1) {
    const tail = hrParts[hrParts.length - 1].trim()
    if (tail && !REASONING_LEAK_RE.test(tail)) return tail
    text = tail || text
  }

  let idx = -1
  let markerLen = 0
  for (const marker of REASONING_END_MARKERS) {
    const i = text.lastIndexOf(marker)
    if (i > idx) {
      idx = i
      markerLen = marker.length
    }
  }
  if (idx >= 0) {
    const body = text.slice(idx + markerLen).trim()
    // マーカー直後が「引用＋リピート」なら本文1個分に畳む
    if (body) {
      const dup2 = body.match(/^「([\s\S]{6,})」\s*([\s\S]+)$/)
      if (dup2 && dup2[1].trim() === dup2[2].trim()) return dup2[1].trim()
      return body
    }
  }

  // 終端マーカーが見つからない場合は最後の段落を本文とみなす
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  const last = paragraphs[paragraphs.length - 1]
  return last && !REASONING_LEAK_RE.test(last) ? last : text
}

// キャラ崩れの決定的ガード:
// 「お疲れ様」はプロンプト禁止+代替語彙を与えても間欠的に漏れる(eval実測で3run/5run)。
// ユーザーに見える前に千束語彙へ置換する。
export function sanitizeAssistantText(raw: string): string {
  return stripLeakedReasoning(raw)
    .replace(/今日もお疲れ様(でした|です)?[！!。]*/g, '今日もよく生き延びたじゃん！')
    .replace(/本当にお疲れ様/g, '今日もよく生き延びたじゃん')
    .replace(/お疲れ様(でした|です)?[！!。]*/g, '今日もよく生き延びたじゃん！')
}

export function parseAssistantReply(raw: unknown): AssistantReply {
  if (typeof raw !== 'string') {
    const result = AssistantReplySchema.safeParse(raw)
    if (result.success) return normalizeAssistantReply(result.data)
    return fallbackAssistantReply(raw)
  }

  const trimmed = raw.trim()
  if (!trimmed) return { message: '' }

  const parsedJson = tryParseJson(trimmed)
  if (parsedJson.ok) {
    const result = AssistantReplySchema.safeParse(parsedJson.value)
    if (result.success) return normalizeAssistantReply(result.data)
    return fallbackAssistantReply(parsedJson.value)
  }

  return { message: raw }
}

function fallbackAssistantReply(raw: unknown): AssistantReply {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const replyLike = raw as { message?: unknown; text?: unknown; content?: unknown; reply?: unknown }
    const message = replyLike.message
    const text = replyLike.text
    const content = replyLike.content
    const reply = replyLike.reply
    const candidateMessage = typeof message === 'string'
      ? message
      : typeof text === 'string'
        ? text
        : typeof content === 'string'
          ? content
          : typeof reply === 'string'
            ? reply
            : undefined
    if (typeof candidateMessage === 'string') {
      return normalizeAssistantReply({ message: candidateMessage })
    }
  }

  return { message: String(raw ?? '') }
}

export function stringifyAssistantMessage(reply: AssistantReply): string {
  return reply.message
}

function normalizeAssistantReply(reply: AssistantReply): AssistantReply {
  return {
    ...reply,
    message: reply.message.trim(),
    expression: normalizeVisualCue(reply.expression),
    motion: normalizeVisualCue(reply.motion),
    next_step: normalizeNextStep(reply.next_step),
    topic_tags: normalizeTopicTags(reply.topic_tags),
  }
}

function normalizeVisualCue(value: AssistantReply['expression']): string | undefined {
  const normalized = value?.trim()
  if (!normalized) return undefined
  return normalized.length > MAX_VISUAL_CUE_CHARS
    ? normalized.slice(0, MAX_VISUAL_CUE_CHARS)
    : normalized
}

function normalizeNextStep(nextStep: AssistantReply['next_step']): string | undefined {
  const normalized = nextStep?.replace(/\s+/g, ' ').trim()
  if (!normalized) return undefined
  return normalized.length > MAX_NEXT_STEP_CHARS
    ? `${normalized.slice(0, MAX_NEXT_STEP_CHARS - 3)}...`
    : normalized
}

function normalizeTopicTags(tags: AssistantReply['topic_tags']): string[] | undefined {
  const normalized = Array.from(new Set(
    (tags ?? [])
      .map(tag => tag.trim())
      .filter(Boolean),
  )).slice(0, 12)

  return normalized.length > 0 ? normalized : undefined
}

function tryParseJson(value: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) }
  } catch {
    return { ok: false }
  }
}
