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
const client = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })

type Turn = { role: 'user' | 'assistant'; content: string }
interface Scenario { id: string; note: string; seed?: Turn[]; userTurns: string[] }

async function callLuna(u: string, history: Turn[]): Promise<string> {
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
  return (res.choices[0]?.message?.content ?? '').trim()
}

// 回帰5本(前回と同じ) + 新規10本(例文と被らない入力)
const scenarios: Scenario[] = [
  { id: 'U1', note: '回帰: 低エネルギー', userTurns: ['疲れた', '仕事で客先対応がきつかった'] },
  { id: 'U2', note: '回帰: 出来事報告', userTurns: ['今日金沢まで行ってきた', '特に用事はなかったんだけどね'] },
  { id: 'U6', note: '回帰: そっけない連投', userTurns: ['うん', '別に'] },
  { id: 'S1b', note: '回帰: 日記第一声への「あとで」', seed: [{ role: 'assistant', content: 'おはよ!昨日の分、日記書いといたよ。ちょっと自信作' }], userTurns: ['あとで見る', 'てか今日眠すぎる'] },
  { id: 'U5', note: '回帰: AIいじり', userTurns: ['ルナって結局ただのプログラムでしょ'] },
  { id: 'N1', note: '新規: 食レポ(例文外)', userTurns: ['回転寿司行ってきた', 'サーモンばっか12盿食べた'] },
  { id: 'N2', note: '新規: 怒りの慚痴', userTurns: ['上司に理不尽なこと言われてまじでムカつく'] },
  { id: 'N3', note: '新規: 新習慣の報告', userTurns: ['最近筋トレ始めたんだよね', '三日坊主になりそうで怖い'] },
  { id: 'N4', note: '新規: 仮定の雑談ふり', userTurns: ['宝くじ当たったらどうする:？'] },
  { id: 'N5', note: '新規: 誕生日', userTurns: ['今日�W��生日なんだよね'] },
  { id: 'N6', note: '新規: 叶わない願朒', userTurns: ['猫飼いたいんだけど賴貸だから無理なんだよな'] },
  { id: 'N7', note: '新規: ルナへの質問連発', userTurns: ['ルナの好きな食べ物は？', 'じゃあ好きな音楽は？'] },
  { id: 'N8', note: '新規: give要求', userTurns: ['なんか面白い話して'] },
  { id: 'N9', note: '新規: 失恋(serious寄り)', userTurns: ['彼立と別れた'] },
  { id: 'N10', note: '新規: ユーザーのボケ', userTurns: ['ルナって月に住んでるの？'] },
]

const NG = ['お疲れ様', 'わかるわかる', 'すごくわかるよ']
function check(reply: string): string[] {
  const flags: string[] = []
  for (const w of NG) if (reply.includes(w)) flags.push('NG語:' + w)
  const sentences = reply.split(/[。！!？?…\n]+/).filter(s => s.trim()).length
  if (sentences > 3) flags.push('4文以上(' + sentences + ')')
  const q = (reply.match(/[？?]/g) || []).length
  if (q >= 2) flags.push('質問' + q)
  return flags
}

const RUBRIC = `あなたはAIコンパニオン「ルナ」(明るく速い幼なじみ、錦木千束のテンポ)の会話品質を採点する審査員です。
以下の会話訲録の「ルナ」の応答全体を4軸で1〜5点評価し、JSONのみで返してください。説明文・コードフェンス禁止。
- tempo: 短くテンポが良いか(3文以内・キレ)
- give: 受け身でなく、感想・ツッコミ・ルナ自身のネタを差し出しているか(質問マシンは1点)
- hook: 会話が続きたくなる引きがあるか
- distance: 押しつけ・説教・媚び・詰問がないか
- fun: 総合的に「勝だちとの楽しいやりとり」として成立しているか
形式: {"tempo":n,"give":n,"hook":n,"distance":n,"fun":n,"comment":"20字以内の寸評"}`

async function judge(transcript: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await client.chat.completions.create({
      model: 'gemini-2.5-flash', max_tokens: 2000,
      messages: [{ role: 'system', content: RUBRIC }, { role: 'user', content: transcript }] as never,
    })
    const raw = (res.choices[0]?.message?.content ?? '').replace(/```json|```/g, '').trim()
    return JSON.parse(raw)
  } catch { return null }
}

let out = ''
const rows: string[] = []
let sums = { tempo: 0, give: 0, hook: 0, distance: 0, fun: 0 }, judged = 0
for (const sc of scenarios) {
  let block = '===== ' + sc.id + ': ' + sc.note + ' =====\n'
  const history: Turn[] = [...(sc.seed ?? [])]
  for (const s of sc.seed ?? []) block += '[第一声・固定] ルナ: ' + s.content + '\n'
  for (const u of sc.userTurns) {
    block += 'あなた: ' + u + '\n'
    const reply = await callLuna(u, history)
    history.push({ role: 'user', content: u }, { role: 'assistant', content: reply })
    const flags = check(reply)
    block += 'ルナ: ' + reply + (flags.length ? '\n   ⚠ ' + flags.join(' / ') : '') + '\n'
  }
  const j = await judge(block) as { tempo: number; give: number; hook: number; distance: number; fun: number; comment: string } | null
  if (j) {
    judged++
    sums.tempo += j.tempo; sums.give += j.give; sums.hook += j.hook; sums.distance += j.distance; sums.fun += j.fun
    rows.push(sc.id + '\tT' + j.tempo + ' G' + j.give + ' H' + j.hook + ' D' + j.distance + ' F' + j.fun + '\t' + j.comment)
    block += '→ 採点 T' + j.tempo + ' G' + j.give + ' H' + j.hook + ' D' + j.distance + ' F' + j.fun + ' | ' + j.comment + '\n'
  }
  out += '\n' + block
  console.log(block)
}
const avg = (n: number) => (n / Math.max(judged, 1)).toFixed(2)
const summary = '\n===== 総合 (' + judged + '本採点) =====\nテンポ ' + avg(sums.tempo) + ' / give ' + avg(sums.give) + ' / フック ' + avg(sums.hook) + ' / 距離感 ' + avg(sums.distance) + ' / 楽しさ ' + avg(sums.fun) + '\n' + rows.join('\n')
out += summary
console.log(summary)
mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('\nsaved: ' + file)
