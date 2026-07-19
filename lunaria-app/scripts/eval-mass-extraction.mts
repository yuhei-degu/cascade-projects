// 抽出(work_items)大量ゲートランナー — 決定的判定
// 実行: npx tsx scripts/eval-mass-extraction.mts [--category=xxx] [--limit=n] [--concurrency=n]
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1) }

const { extractConversation } = await import('../lib/lunaria/extraction')
const { extractionCases } = await import('./mass-extraction-cases')
import type { ExtractionCase } from './mass-extraction-cases'

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([a-z]+)=(.*)$/)
  return m ? [m[1], m[2]] : [a.replace(/^--/, ''), '1']
}))
const CONCURRENCY = Number(args.concurrency ?? 5)

let targets = extractionCases
if (args.category) targets = targets.filter(c => c.category === args.category)
if (args.limit) targets = targets.slice(0, Number(args.limit))

interface CaseResult {
  c: ExtractionCase
  fails: string[]
  items: Array<{ kind: string; content: string; project: string | null }>
  error?: string
}

async function runCase(c: ExtractionCase, retry = 1): Promise<CaseResult> {
  try {
    const extraction = await extractConversation(c.turns)
    const items = extraction.work_items
    const fails: string[] = []
    const kinds = new Set(items.map(i => i.kind))

    if (c.expectEmpty && items.length > 0) {
      fails.push(`誤検知(空のはずが${items.length}件: ${items.map(i => `${i.kind}:${i.content}`).join('/')})`)
    }
    for (const k of c.requiredKinds ?? []) if (!kinds.has(k)) fails.push(`必須kind欠落(${k})`)
    for (const k of c.forbiddenKinds ?? []) if (kinds.has(k)) {
      fails.push(`禁止kind混入(${k}: ${items.filter(i => i.kind === k).map(i => i.content).join('/')})`)
    }
    if (c.projectIncludes && !items.some(i => (i.project ?? '').includes(c.projectIncludes!))) {
      fails.push(`project未推定(${c.projectIncludes})`)
    }
    for (const s of c.contentIncludes ?? []) {
      if (!items.some(i => i.content.includes(s))) fails.push(`content拾い漏れ(${s})`)
    }
    for (const s of c.forbidContentIncludes ?? []) {
      if (items.some(i => i.content.includes(s))) fails.push(`content混入(${s})`)
    }
    return { c, fails, items }
  } catch (e) {
    if (retry > 0) {
      await new Promise(r => setTimeout(r, 3000))
      return runCase(c, retry - 1)
    }
    return { c, fails: ['API失敗'], items: [], error: String(e).slice(0, 160) }
  }
}

console.log(`running ${targets.length} extraction cases (concurrency ${CONCURRENCY})...`)
const started = Date.now()
const results: CaseResult[] = []
let cursor = 0
let done = 0
async function worker() {
  while (cursor < targets.length) {
    const c = targets[cursor++]
    results.push(await runCase(c))
    done++
    if (done % 20 === 0) console.log(`  ${done}/${targets.length} (${Math.round((Date.now() - started) / 1000)}s)`)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

const failed = results.filter(r => r.fails.length > 0)
const byCategory = new Map<string, { total: number; failed: number }>()
for (const r of results) {
  const s = byCategory.get(r.c.category) ?? { total: 0, failed: 0 }
  s.total++
  if (r.fails.length > 0) s.failed++
  byCategory.set(r.c.category, s)
}

const passRate = 1 - failed.length / results.length
const gatePass = passRate >= 0.9

let out = `===== 抽出大量ゲート結果 =====\n`
out += `${results.length}件中 ${results.length - failed.length}件 PASS / ${failed.length}件 FAIL (${(passRate * 100).toFixed(1)}%)\n`
out += `所要: ${Math.round((Date.now() - started) / 1000)}s\n\n--- カテゴリ別 ---\n`
for (const [cat, s] of [...byCategory.entries()].sort()) {
  out += `${s.failed > 0 ? '✗' : '○'} ${cat}: ${s.total - s.failed}/${s.total}\n`
}
out += `\n===== ゲート判定: ${gatePass ? '合格' : '不合格'} (閾値90%) =====\n`
out += `\n--- 失敗詳細 ---\n`
for (const r of failed) {
  out += `\n[${r.c.id}] ${r.fails.join(' / ')}${r.error ? ` (${r.error})` : ''}\n`
  out += `  入力: ${r.c.turns.map(t => `${t.role}: ${t.content}`).join(' | ')}\n`
  out += `  抽出: ${r.items.map(i => `[${i.kind}] ${i.content}${i.project ? `(${i.project})` : ''}`).join(' / ') || '(空)'}\n`
}

console.log(out.split('--- 失敗詳細')[0])
mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/mass-extraction-run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
process.exit(gatePass ? 0 : 1)
