import OpenAI from 'openai'
import { z } from 'zod'
import { ExtractionSchema } from './types'
import type { Extraction } from './types'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

const EXTRACT_SYSTEM = `あなたは会話分析エンジンです。
ユーザーとAIの会話を分析し、以下のJSONのみを返してください。マークダウン不要。

{
  "summary": "会話の要約（1〜2文）",
  "emotions": {
    "joy": 0,
    "anger": 0,
    "sadness": 0,
    "shyness": 0,
    "loneliness": 0,
    "anxiety": 0
  },
  "importance_score": 1,
  "self_disclosure_depth": 0,
  "affinity_delta": 0,
  "status_updates": [],
  "unresolved_issues": [],
  "long_term_candidate": null
}

判定基準：
emotions: 各感情の強さ 0〜10
importance_score: 1〜5（喪失・恋愛・仕事の成果＝4〜5、雑談＝1〜2）
self_disclosure_depth:
  0=事実のみ / 1=感情あり / 2=価値観・弱音 / 3=核心的な本音
affinity_delta: depth 0→0点, 1→1点, 2→2〜3点, 3→4〜5点
status_updates: [{type:"job|relationship|goal|other", value:"変更内容"}]
unresolved_issues: 翌日に持ち越す未解決の話題
long_term_candidate: {type:"value|pattern|goal|trigger", content:"内容"} または null`

export async function extractConversation(
  messages: Array<{ role: 'user' | 'ai'; content: string }>,
): Promise<Extraction> {
  const conversation = messages
    .map(m => `${m.role === 'user' ? 'ユーザー' : 'ルナ'}: ${m.content}`)
    .join('\n')

  const res = await gemini.chat.completions.create({
    model: 'gemini-1.5-flash',
    max_tokens: 600,
    messages: [
      { role: 'system', content: EXTRACT_SYSTEM },
      { role: 'user',   content: `以下の会話を分析してください:\n\n${conversation}` },
    ],
  })

  const raw = res.choices[0]?.message?.content ?? '{}'
  const json = raw.replace(/```json|```/g, '').trim()

  try {
    return ExtractionSchema.parse(JSON.parse(json))
  } catch {
    // パースエラー時はデフォルト値を返す
    return ExtractionSchema.parse({
      summary: '会話の記録', emotions: {
        joy: 1, anger: 0, sadness: 1, shyness: 0, loneliness: 2, anxiety: 1,
      },
      importance_score: 1, self_disclosure_depth: 0, affinity_delta: 0,
      status_updates: [], unresolved_issues: [], long_term_candidate: null,
    })
  }
}
