import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { LUNARIA_SYSTEM_PROMPT, buildClaudePrompt } from './prompt'
import { humanize } from './humanizer'
import type { Message, Memory, ClaudeResponse } from './types'

// Gemini を OpenAI 互換エンドポイントで呼ぶ（@google/generative-ai 不使用）
const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Gemini Flash（light_normal）────────────────────────────────
export async function callGemini(
  userMessage: string,
  history: Message[],
  _lengthPolicy: 'short' | 'natural' | 'extended' = 'natural',
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
    ...history.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]
  const res = await gemini.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 200,
    messages,
  })
  const raw = res.choices[0]?.message?.content ?? 'ちょい待って'
  return humanize(raw, 'natural').text
}

// ── Claude Sonnet（claude_serious）──────────────────────────
export async function callClaude(
  userMessage: string,
  history: Message[],
  mem: Memory,
): Promise<ClaudeResponse> {
  const messages = [
    ...history.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]
  const res = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: buildClaudePrompt(mem),
    messages,
  })
  const raw  = (res.content[0] as { text: string }).text
  const json = raw.match(/\{[\s\S]*\}/)
  if (json) {
    try {
      const parsed = JSON.parse(json[0]) as ClaudeResponse
      parsed.message = humanize(parsed.message, 'extended').text
      return parsed
    } catch { /* fallthrough */ }
  }
  return {
    message:  humanize(raw.replace(/\{[\s\S]*\}/, '').trim() || 'うまく言えないんだけど、ちょい考えてる', 'natural').text,
    emotion:  'empathy', intensity: 1,
    extract:  { type: null, content: null },
  }
}

export const safe = <T>(s: string, fb: T): T => {
  try { return JSON.parse(s) } catch { return fb }
}
