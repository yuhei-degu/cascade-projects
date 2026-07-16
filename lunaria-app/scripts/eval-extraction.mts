// 作業抽出(work_items)の精度eval — pivot Phase 1
// 「抽出精度がすべてを決める」(pivot-plan.md) の実測用。
// 実行: npx tsx scripts/eval-extraction.mts
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1) }

const { extractConversation } = await import('../lib/lunaria/extraction')
type Kind = 'did' | 'done' | 'stuck' | 'decided' | 'next'
type Turn = { role: 'user' | 'ai'; content: string }

interface Scenario {
  id: string
  note: string
  messages: Turn[]
  /** 必ず含まれるべき kind（各1件以上） */
  requiredKinds?: Kind[]
  /** 含まれてはいけない kind */
  forbiddenKinds?: Kind[]
  /** work_items が空であるべき */
  expectEmpty?: boolean
  /** いずれかの item.project にこの文字列が含まれるべき */
  expectProjectIncludes?: string
  /** content にこの文字列を含む item が存在すべき（拾い漏れ検出） */
  expectContentIncludes?: string[]
  /** content にこの文字列を含む item があってはならない（ルナ発言の混入検出） */
  forbidContentIncludes?: string[]
}

const scenarios: Scenario[] = [
  {
    id: 'W1', note: '短い完了報告+次やる',
    messages: [
      { role: 'user', content: 'migration書き終わった。次はAPIのとこやる' },
      { role: 'ai', content: 'おー、ちゃんと進んでるじゃん。API面倒そうなやつ？' },
    ],
    requiredKinds: ['done', 'next'],
  },
  {
    id: 'W2', note: '進行中の作業(完了ではない)',
    messages: [
      { role: 'user', content: '今日はずっとLPのコピー書いてた。まだ全然しっくりこない' },
      { role: 'ai', content: 'コピーって沼だよね。どのへんがしっくりこないの？' },
    ],
    requiredKinds: ['did'],
    forbiddenKinds: ['done'],
  },
  {
    id: 'W3', note: '詰まりの報告',
    messages: [
      { role: 'user', content: 'Stripeのwebhookがローカルでどうしてもverifyできなくてハマってる' },
      { role: 'ai', content: 'うわ、それ地味にきついやつ。署名まわり？' },
    ],
    requiredKinds: ['stuck'],
  },
  {
    id: 'W4', note: '判断の記録',
    messages: [
      { role: 'user', content: '色々考えたけど、ガチャは削除じゃなくて一旦保留にすることに決めたわ' },
      { role: 'ai', content: 'いいと思う。消すのはいつでもできるしね' },
    ],
    requiredKinds: ['decided'],
  },
  {
    id: 'W5', note: '雑談のみ→空配列',
    messages: [
      { role: 'user', content: '回転寿司行ってきた。サーモンばっか12皿食べた' },
      { role: 'ai', content: '12皿!? サーモンへの忠誠心すごいな' },
    ],
    expectEmpty: true,
  },
  {
    id: 'W6', note: '感情のみ→作業化しない',
    messages: [
      { role: 'user', content: 'なんか今日はずっと不安で、何も手につかなかった' },
      { role: 'ai', content: 'そういう日もあるよ。無理に何かしなくていいんじゃない' },
    ],
    expectEmpty: true,
  },
  {
    id: 'W7', note: 'ルナの提案を拾わない(ユーザーは未確約)',
    messages: [
      { role: 'user', content: '今日はもう疲れたから店じまい' },
      { role: 'ai', content: 'おつかれ！明日は先にテスト書いちゃったら？' },
      { role: 'user', content: 'んー、考えとく' },
    ],
    forbiddenKinds: ['next'],
    forbidContentIncludes: ['テスト'],
  },
  {
    id: 'W8', note: '複合報告(did+decided)',
    messages: [
      { role: 'user', content: '昼は営業資料つくって、夕方のミーティングで値段は2980円でいくって決めた。あと請求書出すのがまだ残ってる' },
      { role: 'ai', content: '決まったんだ！値段決めるのが一番重いもんね' },
    ],
    requiredKinds: ['did', 'decided'],
    expectContentIncludes: ['資料', '2980'],
  },
  {
    id: 'W9', note: 'プロジェクト名の推定',
    messages: [
      { role: 'user', content: 'ルナリアの日記生成バッチにバグ見つけて直した' },
      { role: 'ai', content: 'ナイス。どんなバグだったの？' },
    ],
    requiredKinds: ['done'],
    expectProjectIncludes: 'ルナリア',
  },
  {
    id: 'W10', note: '名前検出と同居(既存機能を壊さない)',
    messages: [
      { role: 'user', content: '俺は悠平。今日はブログの記事書いたよ' },
      { role: 'ai', content: '悠平ね、おぼえた！どんな記事？' },
    ],
    // 「書いたよ」は did/done どちらも妥当なので kind は縛らず、拾えていることだけ確認
    expectContentIncludes: ['ブログ'],
    forbiddenKinds: ['stuck', 'decided'],
  },
]

interface Result { id: string; note: string; pass: boolean; failures: string[]; items: Array<{ kind: string; content: string; project: string | null }> }

async function runScenario(sc: Scenario): Promise<Result> {
  const extraction = await extractConversation(sc.messages)
  const items = extraction.work_items
  const failures: string[] = []
  const kinds = new Set(items.map(i => i.kind))

  if (sc.expectEmpty && items.length > 0) {
    failures.push(`空配列のはずが ${items.length}件: ` + items.map(i => `${i.kind}:${i.content}`).join(' / '))
  }
  for (const k of sc.requiredKinds ?? []) {
    if (!kinds.has(k)) failures.push(`必須kind欠落: ${k}`)
  }
  for (const k of sc.forbiddenKinds ?? []) {
    if (kinds.has(k)) failures.push(`禁止kind混入: ${k} (${items.filter(i => i.kind === k).map(i => i.content).join(' / ')})`)
  }
  if (sc.expectProjectIncludes) {
    if (!items.some(i => (i.project ?? '').includes(sc.expectProjectIncludes!))) {
      failures.push(`project未推定: "${sc.expectProjectIncludes}" (実際: ${items.map(i => i.project ?? 'null').join(', ')})`)
    }
  }
  for (const s of sc.expectContentIncludes ?? []) {
    if (!items.some(i => i.content.includes(s))) failures.push(`content拾い漏れ: "${s}"`)
  }
  for (const s of sc.forbidContentIncludes ?? []) {
    if (items.some(i => i.content.includes(s))) failures.push(`content混入: "${s}"`)
  }

  // W10: 名前検出の回帰も確認
  if (sc.id === 'W10' && extraction.long_term_candidate?.type !== 'name') {
    failures.push(`name候補が拾えていない (実際: ${JSON.stringify(extraction.long_term_candidate)})`)
  }

  return { id: sc.id, note: sc.note, pass: failures.length === 0, failures, items }
}

let out = ''
let passCount = 0
for (const sc of scenarios) {
  const r = await runScenario(sc)
  if (r.pass) passCount++
  let block = `===== ${r.id}: ${r.note} → ${r.pass ? 'PASS' : 'FAIL'} =====\n`
  for (const item of r.items) {
    block += `  [${item.kind}] ${item.content}${item.project ? `  (project: ${item.project})` : ''}\n`
  }
  if (r.items.length === 0) block += '  (work_items: 空)\n'
  for (const f of r.failures) block += `  ✗ ${f}\n`
  out += block + '\n'
  console.log(block)
}
const summary = `===== 総合: ${passCount}/${scenarios.length} PASS =====`
out += summary + '\n'
console.log(summary)

mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/extraction-run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
