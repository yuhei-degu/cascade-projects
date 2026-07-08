import OpenAI from 'openai'
import { LUNARIA_SYSTEM_PROMPT } from './prompt'
import { humanize } from './humanizer'
import type { Message } from './types'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

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

export const safe = <T>(s: string, fb: T): T => {
  try { return JSON.parse(s) } catch { return fb }
}
