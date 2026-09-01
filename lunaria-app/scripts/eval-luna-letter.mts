// scripts/eval-luna-letter.mts
// 実験1「交換日記」の手紙を、DBなしで文脈を与えて生成し評価する。
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
const { buildLetterInstruction } = await import('../lib/lunaria/morning-voice')
const { detectCharacterBreaks, collapseDuplicateSentences } = await import('../lib/lunaria/reply-guard')
const { sanitizeAssistantText } = await import('../lib/lunaria/assistant-reply')
const client = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })

async function letter(context: string, instruction: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash', max_tokens: 2500,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      { role: 'system', content: context },
      { role: 'system', content: instruction },
      { role: 'user', content: '(朝、アプリを開いた)' },
    ] as never,
  })
  return collapseDuplicateSentences(sanitizeAssistantText((res.choices[0]?.message?.content ?? '').trim()))
}

function check(t: string): string {
  const flags: string[] = []
  const lines = t.split('\n').filter(l => l.trim()).length
  if (lines < 3) flags.push('行数少(' + lines + ')')
  if (lines > 10) flags.push('行数多(' + lines + ')')
  if (/^[\-\*・\d][\.\)、]?\s/m.test(t)) flags.push('箇条書き')
  if (/(です|ます|ください)[。、！\s]/.test(t)) flags.push('敬語')
  if (/頑張ろう|継続|今日も一日/.test(t)) flags.push('義務感')
  if (!/ルナ\s*$/.test(t.trim())) flags.push('署名なし')
  flags.push(...detectCharacterBreaks(t))
  return flags.length ? '  ⚠ ' + flags.join(' / ') : '  ✓'
}

let out = ''
const log = (s: string) => { out += s + '\n'; console.log(s) }

const CASES = [
  { id: 'L1 作業あり',
    ctx: '【前日の記録】\n- やったこと: ログイン周りのバグ修正、画面のデザイン調整\n- 詰まったこと: 認証のリダイレクトが直らない\n- 明日やると言っていたこと: リダイレクトの原因調査\n- 気分: 疲れ気味',
    ins: buildLetterInstruction({ didYesterday: ['ログイン周りのバグ修正'], stuck: ['認証のリダイレクトが直らない'], plannedToday: 'リダイレクトの原因調査', mood: '疲れ気味', userTopics: ['金沢の旅行', '回転寿司'] }) },
  { id: 'L2 何もできず落ち込み',
    ctx: '【前日の記録】\n- やったこと: なし\n- 気分: 落ち込み、自己嫌悪ぎみ',
    ins: buildLetterInstruction({ mood: '落ち込み、自己嫌悪ぎみ', userTopics: ['猫を飼いたい話'] }) },
  { id: 'L3 記録なし(初日)',
    ctx: '【前日の記録】なし',
    ins: buildLetterInstruction({}) },
  { id: 'L4 8日ぶり',
    ctx: '【前日の記録】なし\n【最後の会話】8日前',
    ins: buildLetterInstruction({ lastTalkedDaysAgo: 8, lastTopic: '副業を始めるか迷っていた件' }) },
]

for (const c of CASES) {
  const t = await letter(c.ctx, c.ins)
  log('===== ' + c.id + ' =====\n' + t + '\n' + check(t) + '\n')
}

// 同じ文脈で3通: 毎朝同じ手紙にならないか
log('===== L5 同じ文脈で3通 =====')
const three: string[] = []
for (let i = 0; i < 3; i++) three.push(await letter(CASES[0].ctx, CASES[0].ins))
three.forEach((t, i) => log('--- ' + (i + 1) + '通目 ---\n' + t + '\n'))
const firstLines = new Set(three.map(t => t.split('\n')[0].slice(0, 12)))
log('→ 書き出しの種類 ' + firstLines.size + '/3' + (firstLines.size <= 1 ? '  ⚠ 毎朝同じ' : ''))

mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/letter-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
