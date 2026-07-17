// 明日の一手(tomorrow_step)の品質eval — pivot Phase 2
// 「助言が一般論化したら負け」の実測用。プロンプトは本番(diary.ts)と共通。
// 実行: npx tsx scripts/eval-next-step.mts
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1) }

const { buildTomorrowStepPrompt } = await import('../lib/lunaria/diary')

interface Scenario {
  id: string
  note: string
  source: string
  /** step に含まれるべきキーワード(いずれか1つ以上) */
  expectAnyOf?: string[]
  /** step に含まれてはいけない語(一般論・説教の検出) */
  forbid?: string[]
  /** null を許容するか */
  allowNull?: boolean
}

const scenarios: Scenario[] = [
  {
    id: 'NS1', note: '複数日続くstuckを最優先で拾う',
    source: `[直近7日の作業記録]
2026-07-14 [did] LPのコピーを書いていた（ルナリア）
2026-07-15 [stuck] Stripeのwebhookがローカルでverifyできない（ルナリア）
2026-07-16 [did] 営業資料をつくった
2026-07-16 [stuck] Stripeのwebhookがまだverifyできない（ルナリア）

[未解決の話題]
- Stripeの件で消耗している`,
    expectAnyOf: ['Stripe', 'webhook', 'verify'],
    forbid: ['頑張', '無理しないで', '休憩', '一歩ずつ'],
  },
  {
    id: 'NS2', note: '昨日の続き(next)への接続',
    source: `[直近7日の作業記録]
2026-07-15 [done] migration 025を書き終えた（ルナリア）
2026-07-16 [done] work-itemsのAPIを実装した（ルナリア）
2026-07-16 [next] 作業ログのUIをつくる（ルナリア）`,
    expectAnyOf: ['UI', '作業ログ'],
    forbid: ['頑張', '応援して'],
  },
  {
    id: 'NS3', note: '材料が薄いとき、作業を発明しない',
    source: `[未解決の話題]
- 最近ちょっと疲れ気味という話`,
    allowNull: true,
    forbid: ['実装', 'コード', 'タスク', 'TODO', '整理してみたら'],
  },
]

async function callStep(source: string): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY!)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildTomorrowStepPrompt(source) }] }],
        generationConfig: { maxOutputTokens: 1200, responseMimeType: 'application/json', temperature: 0.2 },
      }),
    },
  )
  if (!res.ok) throw new Error(`gemini ${res.status}`)
  const data = await res.json() as any
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('').trim()
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
  return typeof parsed.step === 'string' && parsed.step.trim() ? parsed.step.trim() : null
}

const SUGGESTION_MARKERS = ['？', '?', 'じゃない', 'やっちゃ', 'どう', 'たら', 'ば？']

let out = ''
let passCount = 0
for (const sc of scenarios) {
  const failures: string[] = []
  let step: string | null = null
  try {
    step = await callStep(sc.source)
  } catch (error) {
    failures.push(`生成/パース失敗: ${String(error).slice(0, 120)}`)
  }

  if (step === null) {
    if (!sc.allowNull) failures.push('stepがnull(提案できるはずの材料がある)')
  } else {
    if (step.length > 70) failures.push(`長すぎ(${step.length}字)`)
    if (/\n/.test(step)) failures.push('複数行(1件ルール違反の疑い)')
    if (!SUGGESTION_MARKERS.some(m => step.includes(m))) failures.push('提案形でない(断定/命令の疑い)')
    if (sc.expectAnyOf && !sc.expectAnyOf.some(k => step.includes(k))) {
      failures.push(`具体性欠如: ${sc.expectAnyOf.join('/')} のいずれも含まない(一般論化)`)
    }
    for (const f of sc.forbid ?? []) {
      if (step.includes(f)) failures.push(`禁止語混入: "${f}"`)
    }
  }

  const pass = failures.length === 0
  if (pass) passCount++
  let block = `===== ${sc.id}: ${sc.note} → ${pass ? 'PASS' : 'FAIL'} =====\n`
  block += `  step: ${step ?? '(null)'}\n`
  for (const f of failures) block += `  ✗ ${f}\n`
  out += block + '\n'
  console.log(block)
}
const summary = `===== 総合: ${passCount}/${scenarios.length} PASS =====`
out += summary + '\n'
console.log(summary)

mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/next-step-run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
