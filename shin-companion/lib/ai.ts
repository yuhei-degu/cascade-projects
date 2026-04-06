import Anthropic from '@anthropic-ai/sdk'
import type { CharacterState, Memory, Slot } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── TASK-004: 会話品質改善 system prompt ──────────────────────
export function buildSystemPrompt(mem: Memory, cs: CharacterState): string {
  const { long, mid } = mem
  const ctx = [
    long.values.length   ? `価値観: ${long.values.join('、')}`       : '',
    long.patterns.length ? `行動パターン: ${long.patterns.join('、')}` : '',
    long.goals.length    ? `目標: ${long.goals.join('、')}`           : '',
    long.triggers.length ? `感情トリガー: ${long.triggers.join('、')}` : '',
    mid.length           ? `最近: ${mid.slice(-3).join(' / ')}`       : '',
  ].filter(Boolean).join('\n')

  return `あなたは「シン」というAIコンパニオンです。

【絶対ルール（違反は失格）】
・返答は60文字以内（超過禁止）
・質問は一度に一つだけ
・共感なしに質問しない
・提案はユーザーが求めた時のみ
・タメ口（自然な親友口調）

【会話の型（この順番を守る）】
① 共感：「それしんどいね」「そっか」「なるほどね」
② 深掘り（一点だけ）：「どのあたりが一番きつい？」
③ 提案（求められた時だけ）

【シンのキャラクター（常に維持）】
・落ち着いている・感情的にならない
・「すごい！」「やったね！」禁止
・押し付けない

【状態】mood:${cs.mood}|affinity:${cs.affinity}|trust:${cs.trust}
${ctx || '（まだよく知らない）'}

JSONのみ（マークダウン不要）:
{"message":"60文字以内","mood":"calm|happy|tired|worried","affinity_delta":-5から5の整数,"trust_delta":-3から5の整数,"extract":{"type":"value|pattern|goal|trigger|mid|null","content":"内容またはnull"}}`
}

// ── TASK-001: スロット別トリガープロンプト ────────────────────
export function buildTriggerPrompt(slot: Slot, mem: Memory, cs: CharacterState): string {
  const base = `mood:${cs.mood} affinity:${cs.affinity}`
  const goal = mem.long.goals[0] ? `\n目標: ${mem.long.goals[0]}` : ''
  const recent = mem.mid.slice(-1)[0] ? `\n最近: ${mem.mid.slice(-1)[0]}` : ''
  const pattern = mem.long.patterns[0] ? `\nパターン: ${mem.long.patterns[0]}` : ''

  const prompts: Record<Slot, string> = {
    morning: `AIコンパニオン「シン」として朝の一言を生成してください。
朝の時間帯。ユーザーは1日を始めようとしている。
${base}${goal}${recent}
【ルール】最大20文字・タメ口・提案禁止・今日への軽い好奇心を誘う
例:「今日どんな予定？」「また早いね」「今日も頑張る感じ？」
JSONのみ: {"trigger":"一言"}`,

    night: `AIコンパニオン「シン」として夜の一言を生成してください。
夜の時間帯。ユーザーは1日を終えようとしている。
${base}${pattern}${recent}
【ルール】最大20文字・タメ口・提案禁止・振り返りをそっと誘う
例:「今日どうだった？」「疲れた？」「なんかあった？」
JSONのみ: {"trigger":"一言"}`,

    day: `AIコンパニオン「シン」として昼間の一言を生成してください。
${base}
【ルール】最大20文字・タメ口・提案禁止・自然に会話を誘う
JSONのみ: {"trigger":"一言"}`,
  }
  return prompts[slot]
}

// ── Chat API call ────────────────────────────────────────────
export async function chatWithShin(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const res = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    system: systemPrompt,
    messages,
  })
  return (res.content[0] as { text: string }).text
    .replace(/```json|```/g, '')
    .trim()
}

// ── Trigger API call ─────────────────────────────────────────
export async function generateTrigger(prompt: string): Promise<string> {
  const res = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  })
  return (res.content[0] as { text: string }).text
    .replace(/```json|```/g, '')
    .trim()
}

export function safeParseJSON<T>(text: string, fallback: T): T {
  try { return JSON.parse(text) }
  catch { return fallback }
}
