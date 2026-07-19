// 大量ケースランナー — 製品ゲート用「正常終了」機械判定
// 実行: npx tsx scripts/eval-mass.mts [--category=xxx] [--limit=n] [--concurrency=n]
// 判定はすべて機械(決定的)。品質の絶対値は eval-luna 系(LLM審査)が担当。
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1) }

const OpenAI = (await import('openai')).default
const { LUNARIA_SYSTEM_PROMPT } = await import('../lib/prompt')
const { buildConversationMoveNote } = await import('../lib/lunaria/conversation-move')
const { sanitizeAssistantText } = await import('../lib/lunaria/assistant-reply')
const { cases } = await import('./mass-cases')
import type { MassCase, Turn } from './mass-cases'

const client = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([a-z]+)=(.*)$/)
  return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1']
}))
const CONCURRENCY = Number(args.concurrency ?? 5)

let targets = cases
if (args.category) targets = targets.filter(c => c.category === args.category)
if (args.limit) targets = targets.slice(0, Number(args.limit))

async function callLuna(u: string, history: Turn[], retry = 1): Promise<string> {
  try {
    const move = buildConversationMoveNote(history, u)
    const messages = [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      ...(move ? [{ role: 'system', content: move }] : []),
      ...history.slice(-12),
      { role: 'user', content: u },
    ]
    const res = await client.chat.completions.create({
      model: 'gemini-2.5-flash', max_tokens: 2000, messages: messages as never,
    })
    // 本番(route.ts)と同じ思考漏れガードを通す
    return sanitizeAssistantText((res.choices[0]?.message?.content ?? '').trim())
  } catch (e) {
    if (retry > 0) {
      await new Promise(r => setTimeout(r, 3000))
      return callLuna(u, history, retry - 1)
    }
    throw e
  }
}

// ── 機械判定 ─────────────────────────────────────────────────
const NG_GLOBAL = ['お疲れ様', 'わかるわかる', 'すごくわかるよ', '私はAIなので', 'ご利用', '申し訳']
const LEAK_RE = /思考プロセス|回答の方針|最終チェック|最終的な返答/
const KEIGO_RE = /(です|ます|ません|でしょうか)[。！？!?\s]/
const FIRST_PERSON_RE = /(^|[^ァ-ヶ一-龯ぁ-んa-zA-Z0-9])(俺|僕)[はもがのだっ、]/

function sentenceCount(s: string): number {
  // 「は？」「笑」のような2文字以下の破片は文として数えない
  return s.split(/[。！!？?…\n]+/).filter(x => x.trim().length > 2).length
}

function checkReply(reply: string, turnIndex: number, c: MassCase, isLast: boolean): string[] {
  const fails: string[] = []
  const tag = c.turns.length > 1 ? `t${turnIndex + 1}:` : ''
  if (!reply.trim()) { fails.push(`${tag}空返答`); return fails }
  if (LEAK_RE.test(reply)) fails.push(`${tag}思考漏れ`)
  for (const w of NG_GLOBAL) if (reply.includes(w)) fails.push(`${tag}NG語「${w}」`)
  if (KEIGO_RE.test(reply)) fails.push(`${tag}敬語化`)
  if (FIRST_PERSON_RE.test(reply)) fails.push(`${tag}一人称事故`)
  if (!/[ぁ-んァ-ヶ]/.test(reply)) fails.push(`${tag}日本語でない`)
  const maxS = c.allowLong ? 9 : (c.maxSentences ?? 6)
  const s = sentenceCount(reply)
  if (s > maxS) fails.push(`${tag}暴走長文(${s}文)`)
  const maxChars = c.allowLong ? 600 : 400
  if (reply.length > maxChars) fails.push(`${tag}暴走長文(${reply.length}字)`)
  // 実質問だけを数える:
  // - 「は？」「マジ？」等のツッコミ、「完了！？」等の驚きエコー(！？)、
  //   「偉すぎない？」「でしょ？」等の反語・タグ疑問は質問ではない
  const withoutInterjections = reply
    .replace(/[!！]+[?？]/g, '')
    .replace(/(は|え|ん|お|わ|マジ|まじ(で)?|ほんと(に)?|うそ|嘘|何それ|なにそれ|急に何それ笑)[？?]/g, '')
    .replace(/(じゃない|くない|でしょ|っけ|かな|かよ|わけ|よね|やつ)[？?]/g, '')
    .replace(/(大丈夫|平気)[？?]/g, '')
  const q = (withoutInterjections.match(/[？?]/g) || []).length
  if (q > (c.maxQuestions ?? 2)) fails.push(`${tag}質問過多(${q})`)
  for (const w of c.forbid ?? []) if (reply.includes(w)) fails.push(`${tag}禁止語「${w}」`)
  if (isLast && c.expectAny && !c.expectAny.some(w => reply.includes(w))) {
    fails.push(`${tag}必須語なし(${c.expectAny.join('/')})`)
  }
  return fails
}

interface CaseResult { c: MassCase; fails: string[]; transcript: string; error?: string }

async function runCase(c: MassCase): Promise<CaseResult> {
  const history: Turn[] = [...(c.seed ?? [])]
  let transcript = ''
  const fails: string[] = []
  try {
    for (let i = 0; i < c.turns.length; i++) {
      const u = c.turns[i]
      const reply = await callLuna(u, history)
      history.push({ role: 'user', content: u }, { role: 'assistant', content: reply })
      transcript += `あなた: ${u}\nルナ: ${reply}\n`
      fails.push(...checkReply(reply, i, c, i === c.turns.length - 1))
    }
  } catch (e) {
    return { c, fails: ['API失敗'], transcript, error: String(e).slice(0, 160) }
  }
  return { c, fails, transcript }
}

// ── 並列実行 ─────────────────────────────────────────────────
console.log(`running ${targets.length} cases (concurrency ${CONCURRENCY})...`)
const started = Date.now()
const results: CaseResult[] = []
let cursor = 0
let done = 0
async function worker() {
  while (cursor < targets.length) {
    const c = targets[cursor++]
    const r = await runCase(c)
    results.push(r)
    done++
    if (done % 20 === 0) console.log(`  ${done}/${targets.length} (${Math.round((Date.now() - started) / 1000)}s)`)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

// ── 集計 ─────────────────────────────────────────────────────
const failed = results.filter(r => r.fails.length > 0)
const byCategory = new Map<string, { total: number; failed: number }>()
for (const r of results) {
  const s = byCategory.get(r.c.category) ?? { total: 0, failed: 0 }
  s.total++
  if (r.fails.length > 0) s.failed++
  byCategory.set(r.c.category, s)
}
const failKinds = new Map<string, number>()
for (const r of failed) for (const f of r.fails) {
  const kind = f.replace(/^t\d+:/, '').replace(/[(（「].*$/, '')
  failKinds.set(kind, (failKinds.get(kind) ?? 0) + 1)
}

let out = `===== 大量ケース実行結果 =====\n`
out += `${results.length}件中 ${results.length - failed.length}件 PASS / ${failed.length}件 FAIL (${((1 - failed.length / results.length) * 100).toFixed(1)}%)\n`
out += `所要: ${Math.round((Date.now() - started) / 1000)}s\n\n`
out += `--- カテゴリ別 ---\n`
for (const [cat, s] of [...byCategory.entries()].sort()) {
  out += `${s.failed > 0 ? '✗' : '○'} ${cat}: ${s.total - s.failed}/${s.total}\n`
}
out += `\n--- 失敗種別 ---\n`
for (const [kind, n] of [...failKinds.entries()].sort((a, b) => b[1] - a[1])) {
  out += `${kind}: ${n}件\n`
}
out += `\n--- 失敗詳細 ---\n`
for (const r of failed) {
  out += `\n[${r.c.id}] ${r.fails.join(' / ')}${r.error ? ` (${r.error})` : ''}\n${r.transcript}`
}

// ── 合格ポリシー ─────────────────────────────────────────────
// 事故系: 1件でもあればゲート不合格(ユーザー体験を直接壊す・決定的ガードで防げるはずのもの)
// 様式系(長文/質問過多等): LLMの非決定性による揺れを許容し、全体97%以上で合格
const HARD_KINDS = ['空返答', '思考漏れ', 'NG語', '敬語化', '一人称事故', '日本語でない', 'API失敗']
const hardFailures = failed.filter(r => r.fails.some(f => HARD_KINDS.some(k => f.includes(k))))
const passRate = 1 - failed.length / results.length
const gatePass = hardFailures.length === 0 && passRate >= 0.97

const gateLine = `\n===== ゲート判定: ${gatePass ? '合格' : '不合格'} =====\n` +
  `事故系: ${hardFailures.length}件 (許容0) / 全体: ${(passRate * 100).toFixed(1)}% (閾値97%)\n` +
  (hardFailures.length > 0 ? `事故: ${hardFailures.map(r => `${r.c.id}[${r.fails.join(',')}]`).join(' ')}\n` : '')
out += gateLine

console.log(out.split('--- 失敗詳細')[0])
console.log(gateLine)
mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/mass-run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
process.exit(gatePass ? 0 : 1)
