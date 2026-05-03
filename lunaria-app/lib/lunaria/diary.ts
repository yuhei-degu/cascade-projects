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

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized
}

interface DiarySource {
  sourceText: string
  importance: number
  sourceMessageCount: number
}

function isMissingDiaryV1Column(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === 'PGRST204' || /title|talked_about|memory_changes|source_message_count|generated_at/i.test(message)
}

async function saveDiary(date: string, diary: Diary): Promise<void> {
  const v1Payload = {
    user_id:              USER_ID,
    diary_date:           date,
    title:                diary.title,
    summary:              diary.summary,
    events:               diary.events,
    talked_about:         diary.talked_about,
    emotions:             diary.emotions,
    luna_comment:         diary.luna_comment,
    unresolved_issues:    diary.unresolved_issues,
    next_topics:          diary.next_topics,
    memory_changes:       diary.memory_changes,
    importance:           diary.importance,
    source_message_count: diary.source_message_count,
    generated_at:         diary.generated_at,
  }

  const { error } = await supabaseAdmin
    .from(T.diary)
    .upsert(v1Payload, { onConflict: 'user_id,diary_date' })

  if (!error) return
  if (!isMissingDiaryV1Column(error)) throw error

  console.warn('[diary] v1 columns unavailable; retrying legacy diary upsert')
  const { error: legacyError } = await supabaseAdmin.from(T.diary).upsert({
    user_id:           USER_ID,
    diary_date:        date,
    summary:           diary.summary,
    events:            diary.events,
    emotions:          diary.emotions,
    luna_comment:      diary.luna_comment,
    unresolved_issues: diary.unresolved_issues,
    next_topics:       diary.next_topics,
    importance:        diary.importance,
  }, { onConflict: 'user_id,diary_date' })

  if (legacyError) throw legacyError
}

async function fetchSourceMessageCount(date: string): Promise<number> {
  const range = getJstDayRange(date)
  const { count } = await supabaseAdmin
    .from('lunaria_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', USER_ID)
    .gte('created_at', range.startIso)
    .lt('created_at', range.endIso)

  return count ?? 0
}

async function buildDiarySource(date: string): Promise<DiarySource | null> {
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
    if (sourceText.trim()) {
      return {
        sourceText,
        importance,
        sourceMessageCount: await fetchSourceMessageCount(date),
      }
    }
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

  return sourceText.trim() ? { sourceText, importance: 2, sourceMessageCount: messages.length } : null
}

function parseDiaryJson(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned
  return JSON.parse(json)
}

function asDiaryObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Diary response was not a JSON object')
  }

  return value as Record<string, unknown>
}

function buildFallbackDiary(source: DiarySource): Diary {
  const lines = source.sourceText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const events = lines
    .filter(line => /^summary:|^unresolved:|^status:|^User:|^Luna:/.test(line))
    .slice(0, 4)
    .map(line => truncateText(line.replace(/^(summary|unresolved|status|User|Luna):\s*/, ''), 56))
    .filter(line => line && line !== '[]')

  const summarySource = lines.find(line => line.startsWith('summary:')) ?? lines[0] ?? 'この日の会話を、あとで見返せるように残しました。'

  return DiarySchema.parse({
    title: '今日の記録',
    summary: truncateText(summarySource.replace(/^summary:\s*/, ''), 160),
    events: events.length > 0 ? events : ['この日の会話を記録しました。'],
    talked_about: [],
    emotions: { joy: 0, anger: 0, sadness: 0, shyness: 0, loneliness: 0, anxiety: 0 },
    luna_comment: 'うまく綴れなかったけど、形だけ残しておくね。',
    unresolved_issues: [],
    next_topics: [],
    memory_changes: [],
    importance: source.importance,
    source_message_count: source.sourceMessageCount,
    generated_at: new Date().toISOString(),
  })
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
- title は12文字前後。詩的すぎず、あとで探せる具体性を残す
- talked_about は短いタグを5個以内
- events は「話したこと・確認したこと」だけ。ユーザーの行動を想像しない
- memory_changes は長期記憶候補だけ。迷う場合は空配列
- luna_comment は自然なタメ口で、50文字以内
- JSONのみ返す

入力:
${source.sourceText}

JSON形式:
{
  "title": "その日の短いタイトル",
  "summary": "その日全体の短い要約",
  "events": ["その日にあったこと、または話したこと"],
  "talked_about": ["短いタグ"],
  "emotions": {"joy":0,"anger":0,"sadness":0,"shyness":0,"loneliness":0,"anxiety":0},
  "luna_comment": "ルナからの一言",
  "unresolved_issues": ["まだ続きそうな話題"],
  "next_topics": ["次回触れるとよさそうな話題"],
  "memory_changes": [{"type":"preference","content":"明示された長期記憶候補","action":"candidate","source_message_count":1}],
  "importance": 1
}`

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = res.choices[0]?.message?.content ?? '{}'

  try {
    const diaryJson = asDiaryObject(parseDiaryJson(raw))
    const parsed = DiarySchema.parse({
      ...diaryJson,
      importance: source.importance,
      source_message_count: source.sourceMessageCount,
      generated_at: new Date().toISOString(),
    })

    await saveDiary(date, parsed)

    return parsed
  } catch (error) {
    console.warn('[diary] parse failed; saving fallback diary', error)
    const fallback = buildFallbackDiary(source)
    await saveDiary(date, fallback)
    return fallback
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
