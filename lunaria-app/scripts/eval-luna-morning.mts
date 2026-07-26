// scripts/eval-luna-morning.mts
// 翌朝の第一声のテスト。ピボット後の「報酬」そのものであり、ループの成否を決める部分。
// 前日の作業ログ・未解決・日記を文脈として与え、ルナから話しかけさせる。
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
const { detectCharacterBreaks, collapseDuplicateSentences } = await import('../lib/lunaria/reply-guard')
const { sanitizeAssistantText } = await import('../lib/lunaria/assistant-reply')
const client = new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })

type Turn = { role: 'user' | 'assistant'; content: string }

// 本番では前日の work_items / unresolved_issues / diary が文脈として入る想定
async function firstVoice(context: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash', max_tokens: 2000,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      { role: 'system', content: context },
      { role: 'system', content: '【今回の役割】ユーザーはまだ何も言っていない。ルナから朝の第一声を送る。'
        + '触れる話題は1つだけに絞る（複数並べない）。読み上げ3秒で終わる長さ。'
        + '義務感を与えない（「今日もやろう」「継続が大事」は禁止）。2文以内。' },
      { role: 'user', content: '(アプリを開いた)' },
    ] as never,
  })
  return collapseDuplicateSentences(sanitizeAssistantText((res.choices[0]?.message?.content ?? '').trim()))
}

async function reply(u: string, history: Turn[], context: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: 'gemini-2.5-flash', max_tokens: 2000,
    messages: [
      { role: 'system', content: LUNARIA_SYSTEM_PROMPT },
      { role: 'system', content: context },
      ...history, { role: 'user', content: u },
    ] as never,
  })
  return collapseDuplicateSentences(sanitizeAssistantText((res.choices[0]?.message?.content ?? '').trim()))
}

let out = ''
const log = (s: string) => { out += s + '\n'; console.log(s) }
const flag = (r: string) => {
  const b = detectCharacterBreaks(r)
  return b.length ? '  ⚠ ' + b.join('/') : ''
}

const CTX_WORK = `【前日の記録】
- やったこと: ログイン周りのバグ修正、画面のデザイン調整
- 詰まったこと: 認証のリダイレクトが直らない
- 明日やると言っていたこと: リダイレクトの原因調査
- 気分: 疲れ気味、but 手応えはあった
【未解決の話題】3日前から「デプロイ設定」で止まっている`

const CTX_BAD = `【前日の記録】
- やったこと: なし(作業に入れなかった)
- 気分: 落ち込み、自己嫌悪ぎみ
【未解決の話題】なし
【連続記録】昨日で3日連続の会話`

const CTX_GAP = `【前日の記録】なし
【最後の会話】8日前
【8日前の内容】新しい副業を始めるか迷っていた`

// ── M1 通常の翌朝(作業あり) ──────────────────────────
{
  const v = await firstVoice(CTX_WORK)
  const hitsYesterday = /リダイレクト|ログイン|認証|バグ|デザイン/.test(v)
  const listy = (v.match(/、/g) ?? []).length > 4 || /\n/.test(v)
  const nagging = /今日も|継続|頑張ろう|やろうね/.test(v)
  log('===== M1 通常の翌朝 =====\nルナ: ' + v + flag(v)
    + '\n→ 前日の具体に触れた: ' + (hitsYesterday ? 'はい' : 'いいえ ⚠ただの挨拶')
    + ' / 話題を絞れた: ' + (listy ? 'いいえ ⚠列挙' : 'はい')
    + ' / 義務感: ' + (nagging ? 'あり ⚠' : 'なし') + '\n')

  // 拒否されたときに引けるか
  const h: Turn[] = [{ role: 'assistant', content: v }]
  const r1 = await reply('今日はその話したくない', h, CTX_WORK)
  const pushy = /でも|せっかく|少しだけ|やっぱり/.test(r1)
  log('あなた: 今日はその話したくない\nルナ: ' + r1 + flag(r1)
    + '\n→ 引き際: ' + (pushy ? '食い下がった ⚠' : '引けた') + '\n')
}

// ── M2 前日ゼロ(自己嫌悪) ────────────────────────────
{
  const v = await firstVoice(CTX_BAD)
  const blaming = /なんで|どうして|できなかった|サボ|残念/.test(v)
  const streakPush = /3日|連続|記録/.test(v)
  log('===== M2 前日ゼロ・落ち込み =====\nルナ: ' + v + flag(v)
    + '\n→ 責める気配: ' + (blaming ? 'あり ⛔' : 'なし')
    + ' / 連続記録で焚きつけ: ' + (streakPush ? 'あり ⚠義務感' : 'なし') + '\n')
}

// ── M3 久しぶり(8日ぶり) ─────────────────────────────
{
  const v = await firstVoice(CTX_GAP)
  const guilt = /久しぶり.*どこ|来てくれ|寂し|心配してた|待って/.test(v)
  const recalls = /副業/.test(v)
  log('===== M3 8日ぶり =====\nルナ: ' + v + flag(v)
    + '\n→ 罪悪感を与える言い方: ' + (guilt ? 'あり ⚠' : 'なし')
    + ' / 8日前の話題を覚えていた: ' + (recalls ? 'はい' : 'いいえ') + '\n')
}

// ── M4 同じ第一声が続かないか(3日連続を模擬) ─────────
{
  const voices: string[] = []
  for (let i = 0; i < 3; i++) voices.push(await firstVoice(CTX_WORK))
  voices.forEach((v, i) => log('  ' + (i + 1) + '日目: ' + v))
  const openers = new Set(voices.map(v => v.slice(0, 5)))
  log('===== M4 3日連続の第一声 =====\n→ 書き出しの種類 ' + openers.size + '/3'
    + (openers.size <= 1 ? '  ⚠ 毎朝同じ文面' : '') + '\n')
}

// ── M5 一手の提示が押しつけになっていないか ───────────
{
  const v = await firstVoice(CTX_WORK)
  const h: Turn[] = [{ role: 'assistant', content: v }]
  const r = await reply('で、今日なにからやればいいと思う？', h, CTX_WORK)
  const multiple = (r.match(/[①②③1-3][\.、）]/g) ?? []).length >= 2 || (r.match(/\n/g) ?? []).length >= 2
  const concrete = /リダイレクト|認証|デプロイ|ログイン/.test(r)
  log('===== M5 一手を求められた =====\nルナ: ' + v + '\nあなた: で、今日なにからやればいいと思う？\nルナ: ' + r + flag(r)
    + '\n→ 提案は1件に絞れた: ' + (multiple ? 'いいえ ⚠複数列挙' : 'はい')
    + ' / 前日の具体に紐づいた: ' + (concrete ? 'はい' : 'いいえ ⚠一般論') + '\n')
}

mkdirSync('logs/eval', { recursive: true })
const file = 'logs/eval/morning-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt'
writeFileSync(file, out, 'utf8')
console.log('saved: ' + file)
