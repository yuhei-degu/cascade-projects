import OpenAI from 'openai'
import { z } from 'zod'
import { ExtractionSchema } from './types'
import type { Extraction } from './types'
import { debugLog, warnLog } from './logger'

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
  "work_items": [],
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
work_items: ユーザーの作業・仕事・プロジェクトの報告。[{kind:"did|done|stuck|decided|next", content:"内容", project:"プロジェクト名 or null"}]
long_term_candidate: {type:"value|pattern|goal|trigger|name", content:"内容"} または null

work_items の判定基準（重要）：
kind の定義:
  did=着手・進行中の作業 / done=完了したこと / stuck=詰まった・ブロックされていること
  decided=下した判断・決定 / next=次にやると言ったこと
- 「〜に1日溶けた」「〜に食われた」「〜待ちで動けない」も stuck
- 進行中の作業は詰まっていても did として残す（同じ作業を did と stuck の両方で挙げてよい）
- next はユーザーが明確にやると言ったものだけ。「考えとく」「それもありかも」は未確約なので拾わない
- ユーザー本人の発言のみから抽出する（ルナの発言・提案は含めない。ユーザーが「やる」と受けた時だけ拾う）
- project は継続的な取り組みの名前（サービス名・案件名・作品名・「卒論」「開業準備」等）
- content はユーザーの言葉に忠実に、1項目1内容で簡潔に（例:「migration 025を書いた」）
- 同じ内容を複数の kind に重複させない。完了報告なら done のみ
- project は会話から明確に推定できる場合のみ入れる。不明なら null
- project はプロジェクト名・サービス名の最短の固有名詞のみ（機能名や作業内容は含めない。例:「ルナリアの日記バッチを直した」→ project:"ルナリア"）
- 作業の話が出ていなければ空配列 [] を返す。雑談や感情を無理に作業化しない

名前の検出（最重要）：
ユーザーが自分の名前を教えた場合は必ず抽出する。
例：「俺は悠平って言うんだ」→ {type:"name", content:"悠平"}
例：「名前は田中です」→ {type:"name", content:"田中"}`

// ── thinking モデル出力からネスト対応で最後の top-level {...} を切り出す ──
function extractLastTopLevelJson(text: string): string {
  const blocks: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escape = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      if (depth === 0) continue
      depth--
      if (depth === 0 && start !== -1) {
        blocks.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }
  return blocks.length > 0 ? blocks[blocks.length - 1] : '{}'
}

export async function extractConversation(
  messages: Array<{ role: 'user' | 'ai'; content: string }>,
  options?: { knownName?: string },
): Promise<Extraction> {
  const conversation = messages
    .map(m => `${m.role === 'user' ? 'ユーザー' : 'ルナ'}: ${m.content}`)
    .join('\n')

  // 既知の名前が渡されている場合、name 重複抽出を抑制して他候補を優先させる
  const systemPrompt = options?.knownName
    ? EXTRACT_SYSTEM +
      `\n\n【重要】ユーザーの名前は既に「${options.knownName}」として登録済みです。\n` +
      `long_term_candidate で type:"name" を返してはいけません。\n` +
      `名前以外の candidate（value / pattern / goal / trigger）があればそちらを優先し、\n` +
      `なければ null を返してください。`
    : EXTRACT_SYSTEM

  const res = await gemini.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 4000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: `以下の会話を分析してください:\n\n${conversation}` },
    ],
  })

  const raw = res.choices[0]?.message?.content ?? '{}'
  // thinking モデルは前後にテキストが入る・複数の top-level JSON がある場合は最後を優先
  // 非貪欲な /\{[\s\S]*?\}/g はネスト（emotions: {...}）で内側ブロックを拾ってしまうので、
  // 文字列リテラル（""）を跨がず depth を数えて top-level の {...} を正しく切り出す。
  const json = extractLastTopLevelJson(raw)

  try {
    const parsed = ExtractionSchema.parse(JSON.parse(json))
    debugLog('[extract] ok, score:', parsed.importance_score, 'summary:', parsed.summary.slice(0, 30))
    return parsed
  } catch (e) {
    warnLog('[extract] parse error, raw:', raw.slice(0, 100))
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
