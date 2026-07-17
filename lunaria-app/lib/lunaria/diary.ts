import { DiarySchema } from './types'
import type { Diary } from './types'
import { supabaseAdmin } from '../supabase'
import { getJstDayRange } from './date'


const T = {
  extractions: 'lunaria_extractions',
  diary:       'lunaria_diary_logs',
  workItems:   'lunaria_work_items',
} as const
interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
    finishReason?: string
  }>
}

// weekly-review.ts からも使うため export（Gemini JSON生成の共通経路）
export async function generateGeminiJson(prompt: string, maxOutputTokens: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    },
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini generateContent failed: ${res.status} ${body.slice(0, 240)}`)
  }

  const data = await res.json() as GeminiGenerateContentResponse
  const text = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new Error(`Gemini returned empty content; finishReason=${data.candidates?.[0]?.finishReason ?? 'unknown'}`)
  }

  return text
}

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

async function saveDiary(date: string, diary: Diary, userId: string): Promise<void> {
  const v1Payload = {
    user_id:              userId,
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
    user_id:           userId,
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

async function fetchSourceMessageCount(date: string, userId: string): Promise<number> {
  const range = getJstDayRange(date)
  const { count } = await supabaseAdmin
    .from('lunaria_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', range.startIso)
    .lt('created_at', range.endIso)

  return count ?? 0
}

async function buildDiarySource(date: string, userId: string): Promise<DiarySource | null> {
  const { data: extractions } = await supabaseAdmin
    .from(T.extractions)
    .select('*')
    .eq('user_id', userId)
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
        sourceMessageCount: await fetchSourceMessageCount(date, userId),
      }
    }
  }

  const range = getJstDayRange(date)
  const { data: messages } = await supabaseAdmin
    .from('lunaria_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
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

function parseGeneratedDiary(raw: string, source: DiarySource): Diary {
  const diaryJson = asDiaryObject(parseDiaryJson(raw))
  return DiarySchema.parse({
    ...diaryJson,
    importance: source.importance,
    source_message_count: source.sourceMessageCount,
    generated_at: new Date().toISOString(),
  })
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

async function repairDiaryGeneration(source: DiarySource): Promise<Diary | null> {
  const repairPrompt = `あなたは Lunaria のルナです。
前回の日記生成がJSONとして壊れました。以下の材料から、短く安全なAI日記JSONだけを返してください。

ルール:
- JSON以外を書かない
- events / talked_about / unresolved_issues / next_topics は各3件以内
- luna_comment は40文字以内
- ユーザーが言っていないことを足さない

入力:
${source.sourceText.slice(0, 6000)}

JSON形式:
{
  "title": "短いタイトル",
  "summary": "短い要約",
  "events": ["話したこと"],
  "talked_about": ["タグ"],
  "emotions": {"joy":0,"anger":0,"sadness":0,"shyness":0,"loneliness":0,"anxiety":0},
  "luna_comment": "一言",
  "unresolved_issues": [],
  "next_topics": [],
  "memory_changes": [],
  "importance": 1
}`

  try {
    const raw = await generateGeminiJson(repairPrompt, 1200)
    return parseGeneratedDiary(raw, source)
  } catch (error) {
    console.warn('[diary] repair generation failed', error)
    return null
  }
}

// ── 明日の一手（pivot Phase 2） ──────────────────────────────
// work_items 直近7日 + 当日の unresolved_issues から1件だけ提案を生成し、
// tomorrow_step に保存する。翌朝の第一声はこれを LLM 呼び出しなしで即返す。

function isMissingColumnOrTable(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === 'PGRST204' || error?.code === '42703' || error?.code === '42P01' ||
    error?.code === 'PGRST205' || /tomorrow_step|lunaria_work_items|schema cache/i.test(message)
}

async function buildTomorrowStepSource(date: string, userId: string, diary: Diary): Promise<string | null> {
  let workLines: string[] = []
  try {
    const since = new Date(new Date(`${date}T12:00:00+09:00`).getTime() - 6 * 24 * 60 * 60 * 1000)
    const sinceDate = new Date(since.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data, error } = await supabaseAdmin
      .from(T.workItems)
      .select('date, kind, content, project')
      .eq('user_id', userId)
      .gte('date', sinceDate)
      .lte('date', date)
      .is('deleted_at', null)
      .order('date', { ascending: true })
      .limit(120)
    if (error) throw error
    workLines = (data ?? []).map((row: any) =>
      `${row.date} [${row.kind}] ${row.content}${row.project ? `（${row.project}）` : ''}`)
  } catch (error) {
    if (!isMissingColumnOrTable(error)) console.warn('[diary] work_items fetch failed', error)
  }

  const unresolved = diary.unresolved_issues.filter(issue => issue.trim().length > 0)
  if (workLines.length === 0 && unresolved.length === 0) return null

  return [
    workLines.length > 0 ? `[直近7日の作業記録]\n${workLines.join('\n')}` : '',
    unresolved.length > 0 ? `[未解決の話題]\n${unresolved.map(issue => `- ${issue}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n')
}

// eval(scripts/eval-next-step.mts) からも同じプロンプトを使うため公開
export function buildTomorrowStepPrompt(source: string): string {
  return `あなたは Lunaria のルナ（明るくテンポのいい幼なじみ、タメ口）です。
以下はユーザーの直近の作業記録と未解決の話題です。
明日の朝いちばんに掛ける「一手」の提案をひとつだけ作ってください。

ルール:
- 1件だけ。複数を並べない（3件は読まれない）
- 断定・命令ではなく提案形（「〜からじゃない？」「〜やっちゃえば？」）
- 直近の続きを最優先。複数日続いている詰まり(stuck)があればそれに触れる
- ユーザーが言っていない作業を発明しない。記録にある語彙をそのまま使う
- 60文字以内。説教しない。励ましすぎない
- 提案できる材料がなければ {"step": null} を返す
- JSONのみ返す

入力:
${source.slice(0, 4000)}

JSON形式:
{"step": "昨日◯◯までやったんでしょ、今日は△△からじゃない？"}`
}

export async function generateTomorrowStep(date: string, userId: string, diary: Diary): Promise<string | null> {
  const source = await buildTomorrowStepSource(date, userId, diary)
  if (!source) return null

  try {
    // thinking モデルは思考トークンも上限に含むため、少なすぎるとJSONが途中で切れる
    const raw = await generateGeminiJson(buildTomorrowStepPrompt(source), 1200)
    const parsed = asDiaryObject(parseDiaryJson(raw))
    const step = typeof parsed.step === 'string' ? parsed.step.trim() : ''
    return step.length > 0 && step.length <= 120 ? step : null
  } catch (error) {
    console.warn('[diary] tomorrow step generation failed', error)
    return null
  }
}

async function saveTomorrowStep(date: string, step: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from(T.diary)
    .update({ tomorrow_step: step })
    .eq('user_id', userId)
    .eq('diary_date', date)
  if (error) {
    if (isMissingColumnOrTable(error)) {
      console.warn('[diary] tomorrow_step column missing (apply migration 026), skipped')
      return
    }
    throw error
  }
}

async function attachTomorrowStep(date: string, userId: string, diary: Diary): Promise<void> {
  try {
    const step = await generateTomorrowStep(date, userId, diary)
    if (step) await saveTomorrowStep(date, step, userId)
  } catch (error) {
    console.warn('[diary] tomorrow step attach failed', error)
  }
}

export async function generateDiary(date: string, userId: string): Promise<Diary | null> {
  const source = await buildDiarySource(date, userId)
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

  const raw = await generateGeminiJson(prompt, 2200)

  try {
    const parsed = parseGeneratedDiary(raw, source)

    await saveDiary(date, parsed, userId)
    await attachTomorrowStep(date, userId, parsed)

    return parsed
  } catch (error) {
    console.warn('[diary] parse failed; retrying compact diary generation', error)
    const repaired = await repairDiaryGeneration(source)
    if (repaired) {
      await saveDiary(date, repaired, userId)
      await attachTomorrowStep(date, userId, repaired)
      return repaired
    }

    console.warn('[diary] saving fallback diary')
    const fallback = buildFallbackDiary(source)
    await saveDiary(date, fallback, userId)
    await attachTomorrowStep(date, userId, fallback)
    return fallback
  }
}

export async function getMorningOpening(userId: string): Promise<string | null> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = new Date(yesterday.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  let { data, error }: { data: any; error: any } = await supabaseAdmin
    .from(T.diary)
    .select('unresolved_issues, next_topics, luna_comment, importance, tomorrow_step')
    .eq('user_id', userId)
    .eq('diary_date', date)
    .maybeSingle()

  if (error && isMissingColumnOrTable(error)) {
    const legacy = await supabaseAdmin
      .from(T.diary)
      .select('unresolved_issues, next_topics, luna_comment, importance')
      .eq('user_id', userId)
      .eq('diary_date', date)
      .maybeSingle()
    data = legacy.data
  }

  if (!data) return null

  // 明日の一手があれば LLM を呼ばず即返す（pivot Phase 2: 第一声を速く・具体的に）
  if (typeof data.tomorrow_step === 'string' && data.tomorrow_step.trim().length > 0) {
    return data.tomorrow_step.trim()
  }

  const unresolved = asStringList(data.unresolved_issues)
  const nextTopics = asStringList(data.next_topics)
  const candidates = [...unresolved, ...nextTopics]
  if (candidates.length === 0) return null

  const useIssue = (data.importance ?? 1) >= 4 && unresolved.length > 0
  const topic = useIssue ? unresolved[0] : candidates[Math.floor(Math.random() * Math.min(candidates.length, 3))]

  const prompt = `あなたは Lunaria のルナです。昨日の話題を、今日の最初の一言として自然に触れてください。
話題: ${topic}
ルール: タメ口。20文字以内。押しつけない。JSONのみ {"message":"一言"}`

  const raw = await generateGeminiJson(prompt, 160)

  try {
    const parsed = asDiaryObject(parseDiaryJson(raw))
    return typeof parsed.message === 'string' ? parsed.message : null
  } catch {
    return null
  }
}
