// lib/lunaria/morning-opening.ts
// 翌朝の第一声を生成する本番経路。
// 旧 getMorningOpening はキャラプロンプトを通さない裸の Gemini 呼び出しで、
// tomorrow_step をそのまま返していたため「報告書が第一声になる」構造だった。
// ここでは eval(scripts/eval-luna-morning.mts)で検証した経路と同じものを使う:
//   文脈収集 → pickHook でコード側が話題を1つ選ぶ → キャラプロンプト＋指示で生成 → ガード
import OpenAI from 'openai'
import { supabaseAdmin } from '../supabase'
import { LUNARIA_SYSTEM_PROMPT } from '../prompt'
import { buildMorningInstruction, buildLetterInstruction, pickHook, type MorningContext, type LetterContext } from './morning-voice'
import { sanitizeAssistantText } from './assistant-reply'
import { collapseDuplicateSentences, detectCharacterBreaks } from './reply-guard'

const T = {
  diary: 'lunaria_diary_logs',
  workItems: 'lunaria_work_items',
  messages: 'lunaria_messages',
} as const

function jstDate(d: Date): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

async function collectContext(userId: string): Promise<MorningContext> {
  const ctx: MorningContext = {}
  const yesterday = jstDate(new Date(Date.now() - 24 * 60 * 60 * 1000))

  // 前日の作業ログ(Phase 1 の成果物)。kind の語彙は緩く受ける
  const wi = await supabaseAdmin
    .from(T.workItems)
    .select('kind, content')
    .eq('user_id', userId)
    .eq('date', yesterday)
    .is('deleted_at', null)
    .limit(30)
  for (const row of (wi.data ?? []) as { kind: string; content: string }[]) {
    const k = String(row.kind)
    if (/^(did|done|completed)/.test(k)) (ctx.didYesterday ??= []).push(row.content)
    else if (/stuck|blocked|problem|issue/.test(k)) (ctx.stuck ??= []).push(row.content)
    else if (/^(next|plan|todo)/.test(k) && !ctx.plannedToday) ctx.plannedToday = row.content
  }

  // 前日の日記(未解決・気分)
  const dy = await supabaseAdmin
    .from(T.diary)
    .select('unresolved_issues, mood, emotions')
    .eq('user_id', userId)
    .eq('diary_date', yesterday)
    .maybeSingle()
  const d = dy.data as { unresolved_issues?: unknown; mood?: unknown } | null
  if (d) {
    if (Array.isArray(d.unresolved_issues)) {
      ctx.unresolved = d.unresolved_issues.filter((x): x is string => typeof x === 'string').map(topic => ({ topic, daysAgo: 1 }))
    }
    if (typeof d.mood === 'string') ctx.mood = d.mood
  }

  // 最後に話した日(久しぶり判定)。列名が違う環境でも落とさない
  try {
    const lm = await supabaseAdmin
      .from(T.messages)
      .select('created_at')
      .eq('user_id', userId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const at = (lm.data as { created_at?: string } | null)?.created_at
    if (at) ctx.lastTalkedDaysAgo = Math.floor((Date.now() - new Date(at).getTime()) / (24 * 60 * 60 * 1000))
  } catch { /* 判定できなければ通常扱い */ }

  return ctx
}

function contextText(ctx: MorningContext): string {
  const lines: string[] = ['【前日の記録】']
  if (ctx.didYesterday?.length) lines.push('- やったこと: ' + ctx.didYesterday.slice(0, 3).join('、'))
  if (ctx.stuck?.length) lines.push('- 詰まったこと: ' + ctx.stuck[0])
  if (ctx.plannedToday) lines.push('- 明日やると言っていたこと: ' + ctx.plannedToday)
  if (ctx.mood) lines.push('- 気分: ' + ctx.mood)
  if (ctx.unresolved?.length) lines.push('【未解決の話題】' + ctx.unresolved.map(u => u.topic).slice(0, 3).join('、'))
  if ((ctx.lastTalkedDaysAgo ?? 0) >= 5) lines.push('【最後の会話】' + ctx.lastTalkedDaysAgo + '日前')
  return lines.length > 1 ? lines.join('\n') : '【前日の記録】なし'
}

// 第一声を生成する。文脈が無い/生成が破綻した場合は null(呼び出し側でテンプレへ)
export async function generateMorningOpening(userId: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const ctx = await collectContext(userId)
  if (!pickHook(ctx)) return null

  const client = new OpenAI({ apiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 2000,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      { role: 'system', content: contextText(ctx) },
      { role: 'system', content: buildMorningInstruction(ctx) },
      { role: 'user', content: '(アプリを開いた)' },
    ],
  })

  const raw = (res.choices[0]?.message?.content ?? '').trim()
  const text = collapseDuplicateSentences(sanitizeAssistantText(raw))
  if (!text || text.length > 140 || detectCharacterBreaks(text).length > 0) return null
  return text
}

// ── 実験1: 朝の手紙 ─────────────────────────────────
// 第一声(2文)と同じ文脈から、5〜8行の手紙を生成する。
// 実験の間は第一声と並存させ、結果で片方を捨てる。
export async function generateMorningLetter(userId: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const base = await collectContext(userId)
  const ctx: LetterContext = { ...base }

  // ルナ側の一言の種: 直近1週間の作業以外の話題を拾う(無ければ固定の好みで書く)
  try {
    const ex = await supabaseAdmin
      .from('lunaria_extractions')
      .select('next_topics')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    const topics = ((ex.data ?? []) as { next_topics?: unknown }[])
      .flatMap(r => Array.isArray(r.next_topics) ? r.next_topics : [])
      .filter((t): t is string => typeof t === 'string' && t.length > 1)
    if (topics.length) ctx.userTopics = topics
  } catch { /* 種がなくても書ける */ }

  const client = new OpenAI({ apiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 2500,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      { role: 'system', content: contextText(ctx) },
      { role: 'system', content: buildLetterInstruction(ctx) },
      { role: 'user', content: '(朝、アプリを開いた)' },
    ],
  })

  const raw = (res.choices[0]?.message?.content ?? '').trim()
  const text = collapseDuplicateSentences(sanitizeAssistantText(raw))
  // 手紙は改行を持つので、長さの上限は第一声より緩める。破綻は捨てる
  if (!text || text.length > 420 || detectCharacterBreaks(text).length > 0) return null
  return text
}
