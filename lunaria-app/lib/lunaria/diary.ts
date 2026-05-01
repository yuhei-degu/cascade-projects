import OpenAI from 'openai'
import { z } from 'zod'
import { DiarySchema } from './types'
import type { Diary, Extraction } from './types'
import { supabaseAdmin } from '../supabase'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

const USER_ID = '00000000-0000-0000-0000-000000000001'
const T = {
  extractions: 'lunaria_extractions',
  diary:       'lunaria_diary_logs',
} as const

// 当日の extraction を集約して日記を生成
export async function generateDiary(date: string): Promise<Diary | null> {
  const { data: extractions } = await supabaseAdmin
    .from(T.extractions)
    .select('*')
    .eq('user_id', USER_ID)
    .eq('session_date', date)
    .order('created_at', { ascending: true })

  if (!extractions || extractions.length === 0) return null

  const summaries = extractions.map((e: any) => e.summary).filter(Boolean).join('\n')
  const allIssues = extractions.flatMap((e: any) => e.unresolved_issues ?? [])
  const maxImportance = Math.max(...extractions.map((e: any) => e.importance_score ?? 1))

  const prompt = `以下の会話要約をもとに、ルナリア（戦友・共犯者キャラ）の視点で日記を生成してください。
JSONのみで返してください。

会話要約:
${summaries}

以下のJSONで返してください:
{
  "summary": "今日全体の要約",
  "events": ["出来事1", "出来事2"],
  "emotions": {"joy":0,"anger":0,"sadness":0,"shyness":0,"loneliness":0,"anxiety":0},
  "luna_comment": "ルナリアの一言コメント（タメ口・ユーモアあり・50文字以内）",
  "unresolved_issues": ["未解決の話題"],
  "next_topics": ["次回触れると良い話題"],
  "importance": 1
}

luna_commentの例:
「今日もよく頑張ったじゃん。あの件、明日どうなるか気になるね」
「いろいろあった日だったな。少し休んでいいと思うよ」`

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (res.choices[0]?.message?.content ?? '{}').replace(/```json|```/g, '').trim()

  try {
    const parsed = DiarySchema.parse({ ...JSON.parse(raw), importance: maxImportance })

    // DB保存
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
  } catch { return null }
}

// 翌朝の第一声：前日の unresolved_issues / next_topics から生成
export async function getMorningOpening(): Promise<string | null> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = yesterday.toISOString().split('T')[0]

  const { data } = await supabaseAdmin
    .from(T.diary)
    .select('unresolved_issues, next_topics, luna_comment, importance')
    .eq('user_id', USER_ID)
    .eq('diary_date', date)
    .single()

  if (!data) return null

  // unresolved_issues 優先、なければ next_topics から選ぶ
  const candidates = [
    ...(data.unresolved_issues ?? []),
    ...(data.next_topics ?? []),
  ].filter(Boolean)

  if (candidates.length === 0) return null

  // 重要度が高い日は unresolved_issues を必ず使う
  const useIssue = (data.importance ?? 1) >= 4 && (data.unresolved_issues ?? []).length > 0
  const topic = useIssue
    ? data.unresolved_issues[0]
    : candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))]

  const prompt = `ルナリア（明るく自然体・戦友キャラ）として、昨日の話題について朝の第一声を作ってください。
話題：「${topic}」
ルール：タメ口・自然・20文字以内・文末は「？」・押しつけない
良い例：「昨日のあの件、どうなった？」「あれ、結局どうしたん？」「今日どうするか決めた？」
悪い例：「昨日は大変だったね、今日は大丈夫？」（長すぎ・説教っぽい）
JSONのみ：{"message":"一言"}`

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  })

  try {
    const raw = (res.choices[0]?.message?.content ?? '{}').replace(/```json|```/g, '').trim()
    return JSON.parse(raw).message ?? null
  } catch { return null }
}
