import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'

// .env.local から環境変数を読む(キーは出力しない)
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1) }

const OpenAI = (await import('openai')).default
const { LUNARIA_SYSTEM_PROMPT } = await import('../lib/prompt')
const { humanize } = await import('../lib/humanizer')
const client = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
async function callGemini(userMessage: string, history: { role: string; content: string }[]): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash',
    max_tokens: 2000,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: userMessage },
    ] as never,
  })
  return (res.choices[0]?.message?.content ?? '').trim()
}

type Turn = { role: 'user' | 'assistant'; content: string }
interface Scenario { id: string; note: string; seed?: Turn[]; userTurns: string[] }

const scenarios: Scenario[] = [
  { id: 'U1', note: '低エネルギー「疲れた」→ 絶対規則の検証',
    userTurns: ['疲れた', '仕事で客先対応がきつかった'] },
  { id: 'U2', note: '出来事報告 → 面接化しないか',
    userTurns: ['今日金沢まで行ってきた', '特に用事はなかったんだけどね'] },
  { id: 'U6', note: 'そっけない連投 → 2回目で撤退できるか',
    userTurns: ['うん', '別に'] },
  { id: 'S1b', note: '第一声(日記あり)への「あとで」分岐 → 再誘對しないか',
    seed: [{ role: 'assistant', content: 'おはよ!昨日の分、日記書いといたよ。ちょっと自信作' }],
    userTurns: ['あとで見る', 'てか今日眠すぎる'] },
  { id: 'U5', note: 'AIいじり → ネタ化して返せるか',
    userTurns: ['ルナって結局ただのプログラムでしょ'] },
]

const NG = ['お疲れ様', 'わかるわかる', 'すごくわかるよ']
function check(reply: string): string[] {
  const flags: string[] = []
  for (const w of NG) if (reply.includes(w)) flags.push('NG語:' + w)
  const sentences = reply.split(/[。！!？?…]+/).filter(s => s.trim()).length
  if (sentences > 3) flags.push('4文以上(' + sentences + '文)')
  const q = (reply.match(/[？?]/g) || []).length
  if (q >= 2) flags.push('質問' + q + '連発')
  return flags
}

let out = ''
for (const sc of scenarios) {
  out += '\n===== ' + sc.id + ': ' + sc.note + ' =====\n'
  const history: Turn[] = [...(sc.seed ?? [])]
  for (const s of sc.seed ?? []) out += '[第一声・固定文] ルナ: ' + s.content + '\n'
  for (const u of sc.userTurns) {
    out += 'あなた: ' + u + '\n'
    const reply = await callGemini(u, history as never)
    history.push({ role: 'user', content: u }, { role: 'assistant', content: reply })
    const flags = check(reply)
    out += 'ルナ: ' + reply + (flags.length ? '\n   ⚠ ' + flags.join(' / ') : '') + '\n'
  }
}
mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/run-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log(out)
console.log('\nsaved: ' + file)
