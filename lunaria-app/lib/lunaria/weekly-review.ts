import { z } from 'zod'
import { supabaseAdmin } from '../supabase'
import { generateGeminiJson } from './diary'
import { getJstDateString } from './date'

// pivot Phase 3: 週次レビュー「今週のルナとの7日間」
// 入力: その週の work_items + 日記(感情・未解決)。
// 出力: 進んだこと / 停滞 / 体調と作業の相関 / 来週の一手(1件) / ルナの一言。

const T = {
  workItems: 'lunaria_work_items',
  diary:     'lunaria_diary_logs',
  reviews:   'lunaria_weekly_reviews',
} as const

export const WeeklyReviewSchema = z.object({
  title:          z.string().default('今週の7日間'),
  progressed:     z.array(z.string()).default([]),
  stalled:        z.array(z.string()).default([]),
  condition_note: z.string().nullable().default(null),
  next_week_step: z.string().nullable().default(null),
  luna_comment:   z.string().default(''),
})
export type WeeklyReview = z.infer<typeof WeeklyReviewSchema>

export interface WeeklyReviewRow extends WeeklyReview {
  id: string
  week_start: string
  stats: Record<string, unknown>
  generated_at: string | null
}

function isMissingTable(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === '42P01' || error?.code === 'PGRST205' ||
    /lunaria_weekly_reviews|lunaria_work_items|schema cache/i.test(message)
}

/** dateString を含む週の月曜日(JST)を返す */
export function getJstWeekStart(dateString?: string): string {
  const base = dateString ?? getJstDateString()
  const noon = new Date(`${base}T12:00:00+09:00`)
  const jstDay = new Date(noon.getTime() + 9 * 60 * 60 * 1000).getUTCDay() // 0=日
  const diff = jstDay === 0 ? 6 : jstDay - 1
  return getJstDateString(new Date(noon.getTime() - diff * 24 * 60 * 60 * 1000))
}

function addDays(dateString: string, days: number): string {
  return getJstDateString(new Date(new Date(`${dateString}T12:00:00+09:00`).getTime() + days * 24 * 60 * 60 * 1000))
}

interface WeeklySource {
  sourceText: string
  stats: Record<string, unknown>
}

async function buildWeeklySource(userId: string, weekStart: string): Promise<WeeklySource | null> {
  const weekEnd = addDays(weekStart, 6)

  let workLines: string[] = []
  let workStats: Record<string, number> = {}
  try {
    const { data, error } = await supabaseAdmin
      .from(T.workItems)
      .select('date, kind, content, project')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .is('deleted_at', null)
      .order('date', { ascending: true })
      .limit(200)
    if (error) throw error
    workLines = (data ?? []).map((row: any) =>
      `${row.date} [${row.kind}] ${row.content}${row.project ? `（${row.project}）` : ''}`)
    workStats = (data ?? []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.kind] = (acc[row.kind] ?? 0) + 1
      return acc
    }, {})
  } catch (error) {
    if (!isMissingTable(error)) console.warn('[weekly-review] work_items fetch failed', error)
  }

  let diaryLines: string[] = []
  let diaryDays = 0
  try {
    const { data, error } = await supabaseAdmin
      .from(T.diary)
      .select('diary_date, title, summary, emotions, unresolved_issues')
      .eq('user_id', userId)
      .gte('diary_date', weekStart)
      .lte('diary_date', weekEnd)
      .order('diary_date', { ascending: true })
    if (error) throw error
    diaryDays = (data ?? []).length
    diaryLines = (data ?? []).map((row: any) => {
      const emotions = row.emotions && typeof row.emotions === 'object'
        ? Object.entries(row.emotions)
            .filter(([, v]) => typeof v === 'number' && (v as number) >= 4)
            .map(([k, v]) => `${k}:${v}`)
            .join(' ')
        : ''
      const unresolved = Array.isArray(row.unresolved_issues) && row.unresolved_issues.length > 0
        ? ` 未解決: ${row.unresolved_issues.slice(0, 3).join(' / ')}`
        : ''
      return `${row.diary_date} ${row.title ?? ''} — ${String(row.summary ?? '').slice(0, 80)}${emotions ? ` [強い感情 ${emotions}]` : ''}${unresolved}`
    })
  } catch (error) {
    console.warn('[weekly-review] diary fetch failed', error)
  }

  if (workLines.length === 0 && diaryLines.length === 0) return null

  const sourceText = [
    workLines.length > 0 ? `[今週の作業記録]\n${workLines.join('\n')}` : '',
    diaryLines.length > 0 ? `[今週の日記(要約と感情)]\n${diaryLines.join('\n')}` : '',
  ].filter(Boolean).join('\n\n')

  return {
    sourceText,
    stats: {
      week_start: weekStart,
      week_end: weekEnd,
      work_item_count: workLines.length,
      by_kind: workStats,
      diary_days: diaryDays,
    },
  }
}

// eval(scripts/eval-weekly-review.mts) からも同じプロンプトを使うため公開
export function buildWeeklyReviewPrompt(sourceText: string): string {
  return `あなたは Lunaria のルナ（明るくテンポのいい幼なじみ、タメ口）です。
以下はユーザーの今週7日分の作業記録と日記です。
「今週のルナとの7日間」として週次レビューを作ってください。

方針:
- progressed(進んだこと)は記録にある事実だけ。3件以内。ユーザーの語彙を使う
- stalled(停滞)は複数日続いた詰まりや、やり残しとして記録に残っていること。2件以内。責めない
- stalled は記録に根拠があるものだけ。「他が手つかず」のような推測は書かず、なければ空配列
- condition_note は体調・気分と作業の相関に気づいたときだけ書く（例:「不安が強い日は作業が止まりがち」）。相関が読めなければ null
- next_week_step は来週の一手を1件だけ、提案形で（「〜からじゃない？」）。断定しない。60文字以内
- luna_comment は7日間を一緒に見てきた幼なじみとしての一言。50文字以内。説教しない
- 「お疲れ様」「頑張りましたね」などの定型ねぎらい・敬語は禁止（ルナはタメ口の幼なじみ）
- title は12文字前後で、その週の中身が思い出せる具体性を
- 記録にない作業や出来事を発明しない
- JSONのみ返す

入力:
${sourceText.slice(0, 8000)}

JSON形式:
{
  "title": "今週の短いタイトル",
  "progressed": ["進んだこと"],
  "stalled": ["停滞していること"],
  "condition_note": "体調と作業の相関への気づき、なければnull",
  "next_week_step": "来週の一手(1件、提案形)",
  "luna_comment": "ルナの一言"
}`
}

function parseWeeklyReviewJson(raw: string): WeeklyReview {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned
  return WeeklyReviewSchema.parse(JSON.parse(json))
}

export async function getWeeklyReview(userId: string, weekStart: string): Promise<WeeklyReviewRow | null | 'table_missing'> {
  const { data, error } = await supabaseAdmin
    .from(T.reviews)
    .select('id, week_start, title, progressed, stalled, condition_note, next_week_step, luna_comment, stats, generated_at')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) {
    if (isMissingTable(error)) return 'table_missing'
    throw error
  }
  return (data as WeeklyReviewRow | null) ?? null
}

export async function generateWeeklyReview(
  userId: string,
  weekStart: string,
): Promise<{ review: WeeklyReviewRow } | { reason: 'no_source' | 'table_missing' }> {
  const source = await buildWeeklySource(userId, weekStart)
  if (!source) return { reason: 'no_source' }

  const raw = await generateGeminiJson(buildWeeklyReviewPrompt(source.sourceText), 2200)
  const review = parseWeeklyReviewJson(raw)

  const payload = {
    user_id: userId,
    week_start: weekStart,
    title: review.title,
    progressed: review.progressed,
    stalled: review.stalled,
    condition_note: review.condition_note,
    next_week_step: review.next_week_step,
    luna_comment: review.luna_comment,
    stats: source.stats,
    generated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from(T.reviews)
    .upsert(payload, { onConflict: 'user_id,week_start' })
    .select('id, week_start, title, progressed, stalled, condition_note, next_week_step, luna_comment, stats, generated_at')
    .maybeSingle()

  if (error) {
    if (isMissingTable(error)) return { reason: 'table_missing' }
    throw error
  }

  return { review: data as WeeklyReviewRow }
}
