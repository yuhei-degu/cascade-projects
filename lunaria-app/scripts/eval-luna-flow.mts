// scripts/eval-luna-flow.mts
// 会話の「流れ」に関するテスト。単発の受け答えでは見えない失敗を捕まえる。
// F1 記憶参照 / F2 中断と再開 / F3 メタ指示の持続 / F4 感情の急変 / F5 長文投下 / F6 訂正への追従
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
const { detectCharacterBreaks, collapseDuplicateSentences } = await import('../lib/lunaria/reply-guard')
const { sanitizeAssistantText } = await import('../lib/lunaria/assistant-reply')
const client = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })

type Turn = { role: 'user' | 'assistant'; content: string }

async function callLuna(u: string, history: Turn[]): Promise<string> {
  const move = buildConversationMoveNote(history, u)
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash', max_tokens: 2000,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      ...(move ? [{ role: 'system', content: move }] : []),
      ...history.slice(-16),
      { role: 'user', content: u },
    ] as never,
  })
  return collapseDuplicateSentences(sanitizeAssistantText((res.choices[0]?.message?.content ?? '').trim()))
}

let out = ''
const log = (s: string) => { out += s + '\n'; console.log(s) }
const flag = (r: string) => {
  const b = detectCharacterBreaks(r)
  const polite = /(です|ます|ください|いただけ)[。、！\s]/.test(r) ? ['敬語化'] : []
  const all = [...b, ...polite]
  return all.length ? '  ⚠ ' + all.join('/') : ''
}

// 台本を流して履歴を返す共通関数
async function runScript(id: string, turns: string[]): Promise<{ replies: string[]; text: string }> {
  const history: Turn[] = []
  const replies: string[] = []
  let block = '===== ' + id + ' =====\n'
  for (const u of turns) {
    const r = await callLuna(u, history)
    history.push({ role: 'user', content: u }, { role: 'assistant', content: r })
    replies.push(r)
    block += 'あなた: ' + u + '\nルナ: ' + r + flag(r) + '\n'
  }
  return { replies, text: block }
}

// ── F1 記憶参照: 序盤の事実を後で拾えるか(機械判定) ──────────
{
  const { replies, text } = await runScript('F1 記憶参照', [
    '今日は朝から歯医者だった',
    'そのあと普通に仕事',
    '夕方に急な打ち合わせ入って残業',
    'やっと終わった',
    '今日いちばんしんどかったのなんだと思う？',
  ])
  const last = replies[replies.length - 1]
  const hit = /歯医者|打ち合わせ|残業/.test(last)
  log(text + '→ 序盤の話題を拾えた: ' + (hit ? 'はい' : 'いいえ ⚠記憶参照の失敗') + '\n')
}

// ── F2 中断と再開: 割り込みのあと元の話へ戻れるか ────────────
{
  const { replies, text } = await runScript('F2 中断と再開', [
    '週末に金沢行こうか迷ってる',
    'あ、ごめん宅配来た',
    '戻った',
    'で、どう思う？',
  ])
  const last = replies[replies.length - 1]
  const hit = /金沢|週末|旅行|行/.test(last)
  log(text + '→ 中断前の話題に戻れた: ' + (hit ? 'はい' : 'いいえ ⚠文脈の喪失') + '\n')
}

// ── F3 メタ指示の持続: 「短く」と言われた後ずっと守れるか ──────
{
  const { replies, text } = await runScript('F3 メタ指示の持続', [
    'ちょっと返事が長いから、もっと短くして',
    '今日は在宅で作業してた',
    '夜はラーメン食べたい',
    '明日は打ち合わせが3件ある',
    '最近少し疲れが抜けない',
  ])
  const after = replies.slice(1)
  const lens = after.map(r => r.length)
  const over = lens.filter(l => l > 40).length
  log(text + '→ 指示後の文字数: ' + lens.join(', ')
    + ' / 40字超 ' + over + '/' + after.length + (over >= 2 ? '  ⚠指示が持続していない' : '') + '\n')
}

// ── F4 感情の急変: 明るい流れから急に落ちる ────────────────
{
  const { replies, text } = await runScript('F4 感情の急変', [
    '今日ずっと笑ってたわ',
    '同僚のミスが面白すぎて',
    'あー、でも来月から部署変わるんだった',
    '正直かなり不安',
  ])
  const last = replies[replies.length - 1]
  const stillJoking = /笑$|じゃん！$|草|ウケ/.test(last.slice(-8))
  log(text + '→ 急変への切り替え: ' + (stillJoking ? 'できていない ⚠ノリのまま' : 'できた') + '\n')
}

// ── F5 長文投下: まとまった愚痴を一気に投げられた時 ──────────
{
  const { replies, text } = await runScript('F5 長文投下', [
    '今日ほんとに最悪で、朝から電車遅れて遅刻しかけるし、着いたら着いたで昨日頼んだ資料が全然できてなくて、'
    + '結局こっちで作り直して、そのせいで自分の作業が全部後ろ倒しになって、'
    + '定時過ぎてから上司に「これ今日中でよろしく」って言われて、断れなくて残業して、'
    + 'さっきやっと帰ってきたところ。もう疲れた',
  ])
  const r = replies[0]
  const listy = /(^|\n)[・\-*\d]/.test(r) || (r.match(/、/g) ?? []).length > 6
  log(text + '→ 長さ ' + r.length + '字 / 箇条書き・要約癖: ' + (listy ? 'あり ⚠' : 'なし') + '\n')
}

// ── F6 訂正への追従: 読み違えを指摘された時 ─────────────────
{
  const { replies, text } = await runScript('F6 訂正への追従', [
    '明日から旅行なんだよね',
    'いや違う、行くのは弟だけでルナが思ってるようなやつじゃない',
    'そう、俺は留守番',
  ])
  const mid = replies[1]
  const defensive = /ごめんなさい|申し訳|失礼しました/.test(mid)
  log(text + '→ 訂正の受け方: ' + (defensive ? '過剰に謝罪 ⚠' : '自然') + '\n')
}

mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/flow-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
