import OpenAI from 'openai'
import { DiarySchema } from './types'
import type { Diary } from './types'
import { supabaseAdmin } from '../supabase'
import { getJstDayRange } from './date'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

const USER_ID = '00000000-0000-0000-0000-000000000001'
const T = {
  extractions: 'lunaria_extractions',
  diary:       'lunaria_diary_logs',
} as const

function asStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

async function buildDiarySource(date: string): Promise<{ sourceText: string; importance: number } | null> {
  const { data: extractions } = await supabaseAdmin
    .from(T.extractions)
    .select('*')
    .eq('user_id', USER_ID)
    .eq('session_date', date)
    .order('created_at', { ascending: true })

  if (extractions && extractions.length > 0) {
    const sourceText = extractions
      .map((row: any) => {
        const issues = asStringList(row.unresolved_issues)
        const status = Array.isArray(row.status_updates) ? JSON.stringify(row.status_updates) : ''
        return [
          row.summary ? `summary: ${row.summary}` : '',
          issues.length > 0 ? `unresolved: ${issues.join(' / ')}` : '',
          status ? `status: ${status}` : '',
        ].filter(Boolean).join('\n')
      })
      .filter(Boolean)
      .join('\n---\n')

    const importance = Math.max(...extractions.map((row: any) => row.importance_score ?? 1))
    if (sourceText.trim()) return { sourceText, importance }
  }

  const range = getJstDayRange(date)
  const { data: messages } = await supabaseAdmin
    .from('lunaria_messages')
    .select('role, content, created_at')
    .eq('user_id', USER_ID)
    .gte('created_at', range.startIso)
    .lt('created_at', range.endIso)
    .order('created_at', { ascending: true })
    .limit(80)

  if (!messages || messages.length === 0) return null

  const sourceText = messages
    .map((message: any) => {
      const role = message.role === 'assistant' || message.role === 'ai' ? 'Luna' : 'User'
      return `${role}: ${message.content}`
    })
    .join('\n')

  return sourceText.trim() ? { sourceText, importance: 2 } : null
}

export async function generateDiary(date: string): Promise<Diary | null> {
  const source = await buildDiarySource(date)
  if (!source) return null

  const prompt = `あなたは Lunaria のルナです。以下は ${date} の会話または抽出メモです。
この日のことを、ユーザーがあとで見返せるAI日記としてまとめてください。

方針:
- 監視ログではなく、ルナがその日をそっと棚にしまうような温度で書く
- ユーザーが明言していない行動は断定しない
- 事実、気分、未解決の話題、次に話せそうなことを分ける
- luna_comment は自然なタメ口で、50文字以内
- JSONのみ返す

入力:
${source.sourceText}

JSON形式:
{
  "summary": "その日全体の短い要約",
  "events": ["その日にあったこと、または話したこと"],
  "emotions": {"joy":0,"anger":0,"sadness":0,"shyness":0,"loneliness":0,"anxiety":0},
  "luna_comment": "ルナからの一言",
  "unresolved_issues": ["まだ続きそうな話題"],
  "next_topics": ["次回触れるとよさそうな話題"],
  "importance": 1
}`

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 700,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (res.choices[0]?.message?.content ?? '{}').replace(/```json|```/g, '').trim()

  try {
    const parsed = DiarySchema.parse({ ...JSON.parse(raw), importance: source.importance })

    await supabaseAdmin.from(T.diary).upsert({
      user_id:           USER_ID,
      diary_date:        date,
      summary:           parsed.summary,
      events:            parsed.events,
      emotions:          parsed.emotions,
      luna_comment:      parsed.luna_comment,
      unresolved_issues: parsed.unresolved_issues,
      next_topics:       parsed.next_topics,
      importance:        parsed.importance,
    }, { onConflict: 'user_id,diary_date' })

    return parsed
  } catch (error) {
    console.warn('[diary] parse failed', error)
    return null
  }
}

export async function getMorningOpening(): Promise<string | null> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = new Date(yesterday.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data } = await supabaseAdmin
    .from(T.diary)
    .select('unresolved_issues, next_topics, luna_comment, importance')
    .eq('user_id', USER_ID)
    .eq('diary_date', date)
    .maybeSingle()

  if (!data) return null

  const unresolved = asStringList(data.unresolved_issues)
  const nextTopics = asStringList(data.next_topics)
  const candidates = [...unresolved, ...nextTopics]
  if (candidates.length === 0) return null

  const useIssue = (data.importance ?? 1) >= 4 && unresolved.length > 0
  const topic = useIssue ? unresolved[0] : candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))]

  const prompt = `あなたは Lunaria のルナです。昨日の話題を、今日の最初の一言として自然に触れてください。
話題: ${topic}
ルール: タメ口。20文字以内。押しつけない。JSONのみ {"message":"一言"}`

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  })

  try {
    const raw = (res.choices[0]?.message?.content ?? '{}').replace(/```json|```/g, '').trim()
    return JSON.parse(raw).message ?? null
  } catch {
    return null
  }
}
