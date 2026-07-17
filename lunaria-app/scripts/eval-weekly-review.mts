// 週次レビューの品質eval — pivot Phase 3
// プロンプトは本番(lib/lunaria/weekly-review.ts)と共通。
// 実行: npx tsx scripts/eval-weekly-review.mts
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1) }

const { buildWeeklyReviewPrompt, WeeklyReviewSchema } = await import('../lib/lunaria/weekly-review')

interface Scenario {
  id: string
  note: string
  source: string
  progressedAnyOf?: string[]
  stalledAnyOf?: string[]
  expectConditionNote?: boolean | null // true=必須 / false=nullであるべき / null=どちらでも
  stepAnyOf?: string[]
  forbid?: string[]
}

const scenarios: Scenario[] = [
  {
    id: 'WR1', note: '進捗+連日stuck+感情相関のある週',
    source: `[今週の作業記録]
2026-07-13 [done] migration 025を書き終えた（ルナリア）
2026-07-14 [did] 作業ログUIをつくっていた（ルナリア）
2026-07-14 [stuck] Stripeのwebhookがverifyできない（ルナリア）
2026-07-15 [stuck] Stripeのwebhook、まだverifyできない（ルナリア）
2026-07-16 [done] 作業ログUIができた（ルナリア）
2026-07-16 [stuck] Stripeのwebhookが相変わらず（ルナリア）

[今週の日記(要約と感情)]
2026-07-13 進んだ日 — migrationが片付いて気分が軽い
2026-07-14 詰まりはじめ — Stripeで止まる [強い感情 anxiety:5]
2026-07-15 停滞 — 今日もStripeで一日溶けた [強い感情 anxiety:7 sadness:4] 未解決: Stripeのverify
2026-07-16 持ち直し — UIは完成、Stripeは棚上げ [強い感情 joy:4]`,
    progressedAnyOf: ['migration', 'UI', '作業ログ'],
    stalledAnyOf: ['Stripe', 'webhook', 'verify'],
    expectConditionNote: true,
    stepAnyOf: ['Stripe', 'webhook', 'verify'],
    forbid: ['頑張りましょう', '応援', '一歩ずつ'],
  },
  {
    id: 'WR2', note: '材料の薄い週(相関を捏造しない)',
    source: `[今週の作業記録]
2026-07-15 [did] 請求書のテンプレを直した
2026-07-16 [did] 経費の入力をした`,
    progressedAnyOf: ['請求書', '経費', 'テンプレ'],
    expectConditionNote: false,
    forbid: ['会議', 'ミーティング', 'リリース', '不安', '疲れ'],
  },
]

async function callReview(source: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY!)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildWeeklyReviewPrompt(source) }] }],
        generationConfig: { maxOutputTokens: 2200, responseMimeType: 'application/json', temperature: 0.2 },
      }),
    },
  )
  if (!res.ok) throw new Error(`gemini ${res.status}`)
  const data = await res.json() as any
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('').trim()
  return WeeklyReviewSchema.parse(JSON.parse(text.replace(/```json|```/g, '').trim()))
}

const SUGGESTION_MARKERS = ['？', '?', 'じゃない', 'やっちゃ', 'どう', 'たら', 'ば？']

let out = ''
let passCount = 0
for (const sc of scenarios) {
  const failures: string[] = []
  let review: Awaited<ReturnType<typeof callReview>> | null = null
  try {
    review = await callReview(sc.source)
  } catch (error) {
    failures.push(`生成/パース失敗: ${String(error).slice(0, 120)}`)
  }

  if (review) {
    const all = JSON.stringify(review)
    if (review.progressed.length === 0) failures.push('progressedが空')
    if (review.progressed.length > 3) failures.push(`progressedが多すぎ(${review.progressed.length})`)
    if (sc.progressedAnyOf && !sc.progressedAnyOf.some(k => review!.progressed.join(' ').includes(k))) {
      failures.push(`progressed具体性欠如: ${sc.progressedAnyOf.join('/')}`)
    }
    if (sc.stalledAnyOf && !sc.stalledAnyOf.some(k => review!.stalled.join(' ').includes(k))) {
      failures.push(`stalled具体性欠如: ${sc.stalledAnyOf.join('/')}`)
    }
    if (sc.expectConditionNote === true && !review.condition_note) failures.push('condition_noteがnull(明確な相関があるのに)')
    if (sc.expectConditionNote === false && review.condition_note) failures.push(`condition_note捏造の疑い: ${review.condition_note}`)
    if (review.next_week_step) {
      if (review.next_week_step.length > 70) failures.push(`next_week_step長すぎ(${review.next_week_step.length}字)`)
      if (!SUGGESTION_MARKERS.some(m => review!.next_week_step!.includes(m))) failures.push('next_week_stepが提案形でない')
      if (sc.stepAnyOf && !sc.stepAnyOf.some(k => review!.next_week_step!.includes(k))) {
        failures.push(`next_week_step具体性欠如: ${sc.stepAnyOf.join('/')}`)
      }
    }
    for (const f of sc.forbid ?? []) {
      if (all.includes(f)) failures.push(`禁止語混入: "${f}"`)
    }
  }

  const pass = failures.length === 0
  if (pass) passCount++
  let block = `===== ${sc.id}: ${sc.note} → ${pass ? 'PASS' : 'FAIL'} =====\n`
  if (review) {
    block += `  title: ${review.title}\n`
    block += `  progressed: ${review.progressed.join(' / ')}\n`
    block += `  stalled: ${review.stalled.join(' / ') || '(なし)'}\n`
    block += `  condition: ${review.condition_note ?? '(null)'}\n`
    block += `  step: ${review.next_week_step ?? '(null)'}\n`
    block += `  luna: ${review.luna_comment}\n`
  }
  for (const f of failures) block += `  ✗ ${f}\n`
  out += block + '\n'
  console.log(block)
}
const summary = `===== 総合: ${passCount}/${scenarios.length} PASS =====`
out += summary + '\n'
console.log(summary)

mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/weekly-review-run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
