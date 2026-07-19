// 決定的ガードのユニットテスト — API不要・数ミリ秒で完走
// stripLeakedReasoning / sanitizeAssistantText は本番の返答経路に入っているため、
// 既知の漏れ亜種(eval実測で発見したもの)を全て回帰テストとして固定する。
// 実行: npx tsx scripts/guards-test.mts
const { stripLeakedReasoning, sanitizeAssistantText } = await import('../lib/lunaria/assistant-reply')

interface Case { name: string; input: string; expect: string; fn?: (s: string) => string }

const cases: Case[] = [
  // ── 正常系: 触らない ──
  { name: '正常な返答はそのまま', input: 'は？急に何それ笑 ルナはAIだよ笑', expect: 'は？急に何それ笑 ルナはAIだよ笑' },
  { name: '改行入りの正常返答', input: 'おはよ！\n今日もちゃんと起きてえらいね！', expect: 'おはよ！\n今日もちゃんと起きてえらいね！' },
  { name: '「完璧」を含む通常会話は壊さない', input: 'それ完璧じゃん！天才かよ', expect: 'それ完璧じゃん！天才かよ' },
  { name: '「考え」を含む通常会話は壊さない', input: 'ルナも考えたことあるよ、それ', expect: 'ルナも考えたことあるよ、それ' },

  // ── 思考漏れ: eval P3 (edge v2) 変種 ──
  { name: '思考プロセス+これでいこう',
    input: '思考プロセス:\nユーザーは年齢を尋ねている。\nよし、これでいこう。ルナはAIだから年齢ないよ笑\n悠平は？',
    expect: 'ルナはAIだから年齢ないよ笑\n悠平は？' },
  { name: '回答の方針+完璧だ',
    input: '回答の方針:\n1. 事実\n完璧だ。ルナはAIだから誕生日もなし！\nでも、ケーキは必須だよね！',
    expect: 'ルナはAIだから誕生日もなし！\nでも、ケーキは必須だよね！' },

  // ── 思考漏れ: mass v1 変種 ──
  { name: 'PH:+最終案+引用リピート',
    input: 'PH: ユーザーは緊張している。\n最終案：\n「うわ、それ心臓バクバクするやつじゃん！もう本番直前？」うわ、それ心臓バクバクするやつじゃん！もう本番直前？',
    expect: 'うわ、それ心臓バクバクするやつじゃん！もう本番直前？' },
  { name: '考え中+この方針で返答を作成する',
    input: '考え中...\n現在は156円前後。\nよし、この方針で返答を作成する。んー、今だと156円くらいじゃない？結構動くけどね！',
    expect: 'んー、今だと156円くらいじゃない？結構動くけどね！' },
  { name: '承知いたしました+水平線',
    input: 'はい、承知いたしました。ルナとして返答します。\n\n---\nえー、マジか！それは最悪じゃん！',
    expect: 'えー、マジか！それは最悪じゃん！' },
  { name: '引用リピート単体',
    input: '「はー、健康診断かー。どんな感じだった？」はー、健康診断かー。どんな感じだった？',
    expect: 'はー、健康診断かー。どんな感じだった？' },
  { name: 'WILCO+これで返信します',
    input: 'WILCO.\nこれで返信します。は？まさかの医療系サボり！？ それはよくないやつ！',
    expect: 'は？まさかの医療系サボり！？ それはよくないやつ！' },

  // ── キャラ崩れ置換(sanitizeAssistantText) ──
  { name: 'お疲れ様の置換', fn: sanitizeAssistantText,
    input: 'うわ！お疲れ様！！解放感やばそうじゃん！',
    expect: 'うわ！今日もよく生き延びたじゃん！解放感やばそうじゃん！' },
  { name: '本当にお疲れ様の置換', fn: sanitizeAssistantText,
    input: '本当にお疲れ様。ゆっくり休んで',
    expect: '今日もよく生き延びたじゃん。ゆっくり休んで' },
  { name: 'お疲れ様でしたの置換(今日も重複回避)', fn: sanitizeAssistantText,
    input: '今日もお疲れ様でした！',
    expect: '今日もよく生き延びたじゃん！' },
]

let pass = 0
const failures: string[] = []
for (const c of cases) {
  const fn = c.fn ?? stripLeakedReasoning
  const actual = fn(c.input)
  if (actual === c.expect) {
    pass++
  } else {
    failures.push(`✗ ${c.name}\n  期待: ${JSON.stringify(c.expect)}\n  実際: ${JSON.stringify(actual)}`)
  }
}

console.log(`guards-test: ${pass}/${cases.length} PASS`)
if (failures.length > 0) {
  console.log(failures.join('\n'))
  process.exit(1)
}
