// Phase G+: ガチャ取得直後のルナのリアクション生成
//
// 設計方針（外部レビュー反映）：
// - 通常会話プロンプトには一切注入しない
// - core_memory / profile / 会話履歴には絶対に保存しない（文脈汚染防止）
// - 1〜2 文の短いコメントのみ
// - 取得直後のモーダル表示用「受け取り演出」として扱う
// - 既存の prompt-builder は使わず、専用の超軽量プロンプトで生成
// - LLM 失敗時はレアリティ別の静的テンプレで fallback（ガチャ自体は壊さない）

import OpenAI from 'openai'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

export interface ReactionInput {
  itemName:      string
  rarity:        string
  category:      string
  description:   string | null
  wasDuplicate:  boolean
  coinEarned:    number
}

// ── 静的フォールバック（LLM 失敗時用） ─────────────────────────
const FALLBACK_NEW: Record<string, string[]> = {
  common_a: [
    'お、もらったね！',
    'これね、いいじゃん',
    'これ、置いとくだけで馴染むやつ',
    'これね、なんかほっとするやつ',
    '小さいけど、ちゃんと嬉しいやつ',
    'ささやかな贈り物って感じ、好きだよ',
    'お、けっこう実用的なの来たね',
    'お、これは机に置いとくと落ち着くやつ',
  ],
  common_b: [
    'お、これ来たね、いい感じ',
    'こういうの、好きだよ',
    'いいの来た',
    'これ、悠平に似合いそう',
    'シンプルだけど雰囲気あるじゃん',
    'お、ささやかなおしゃれ来た',
    'これ、毎日のちょっとしたアクセントに',
    'お、控えめだけど良いやつだね',
  ],
  rare_a: [
    'お、これはちょっと特別！',
    'お、いいの来たね、これは部屋に置きたいやつ',
    'これね、なかなか出会えないやつ',
    'お、これちょっと特別なやつ',
    'やった、これは部屋の主役になるやつ！',
    'これ、悠平の部屋がぐっと素敵になるよ',
    'お、これは飾る系のやつ',
    'ちょっと珍しいやつ、ラッキーだね',
  ],
  rare_b: [
    'お、これはちょっと特別',
    'お、これは身に着ける用の特別品',
    'おしゃれじゃん',
    'お、これ雰囲気変わるやつ！',
    'これ、特別な日に着けるやつ',
    'お、これはなかなか出会えないやつ',
    'お、これは見せたくなるね',
    'ちょっと自慢できるやつ来たね',
  ],
  epic: [
    'お、これはすごい！',
    'うわ、これはちょっと別格',
    'うわ、これは特別な夜のやつ',
    'お、これは月箱の中でも上のやつだね',
    'やった、これは空気変わるやつ！',
    'これ、けっこう運使ったね',
    'うわ、これはちゃんと特別なやつ',
    'これ、ちゃんと大事にしようね',
  ],
  legendary: [
    'え、これは本当にすごいやつ…！',
    'うわ、これは持ってる人少ないよ！',
    'すごいの来たね、悠平！',
    'これは月箱のいちばん奥に置くやつだね',
    'やった、これは長く飾るやつ',
    'うわ、本物だ、こんなの…',
    'やば、これは…ちゃんと飾ろう',
    'うわ、悠平、今日めっちゃ持ってる…',
  ],

  urban_legend: [
    'え、それ…！？マジで！？',
    'うわ、こんなの本当に存在したんだ…',
    'うわ、本当にあるんだ、こういうの',
    'ちょっと待って、これ月箱に入ってたの…？',
    'え、悠平、これ持ってる人ほぼいないよ',
    'え、嘘。これ実在したんだ',
    'うわ、ルナ、ちょっと震えてる',
    'うわ、これは記念日にしよう',
  ],
}

const FALLBACK_DUPLICATE: string[] = [
  'あー、これ前も出たやつ！コインにしとくね',
  'かぶったね、コインに変換しとく',
  'これ持ってるね、ならコインに変えとく',
  'かぶった、コインね',
  'あー、また会えたね（コインに変換）',
  'お、再会だ。コインに変換',
]

function pickFallback(rarity: string, wasDuplicate: boolean): string {
  const pool = wasDuplicate
    ? FALLBACK_DUPLICATE
    : (FALLBACK_NEW[rarity] ?? FALLBACK_NEW.common_a)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── プロンプト構築 ─────────────────────────────────────────────
function buildReactionPrompt(input: ReactionInput): string {
  const { itemName, rarity, category, description, wasDuplicate, coinEarned } = input

  return `あなたは「ルナ」。日本語のみ。
女性、幼なじみ系、錦木千束のテンポ：明るく速い、感嘆符多め、押しつけない、ブレない。
タメ口で話す。

悠平がたった今ガチャを引いて、以下のアイテムを手に入れた。
これに対して 1〜2 文で短くリアクションする。

アイテム名：${itemName}
カテゴリ：${category}
レアリティ：${rarity}
${description ? `説明：${description}` : ''}
${wasDuplicate ? `※既に持っているアイテムだったので、コイン +${coinEarned} に変換された。` : ''}

レアリティ別トーン指針：
- common_a / common_b：軽い気軽さ（「お、これ来たね」「これ、いいじゃん」）
- rare_a / rare_b：少し嬉しい（「お、これはちょっと特別！」「これはなかなか出会えないやつ」）
- epic：素直な喜び（「うわ、これはちょっと別格」「これは月箱の中でも上のやつだね」）
- legendary：盛り上がる（「え、これは本当にすごいやつ…！」「うわ、本物だ、こんなの…」）
- urban_legend：驚愕＋話題性（「え、それ…！？マジで！？」「ちょっと待って、これ月箱に入ってたの…？」）
- かぶり時：軽くいなす（「あー、これ前も出たやつ！コインにしとくね」）

ルール：
- 1〜2 文以内（最大 60 文字）
- 質問はしない（受け取りの瞬間なので）
- 「お疲れ様」「頑張ろう」のような励まし禁止
- 「悠平ってば〜なんだから！」「ふふ」のような媚びた言い回し禁止
- ハズレ感を出さない（コモンでも前向きに）
- 余計な前置き禁止（「えーっと」「そうだね」で始めない）
- 直接リアクションだけを返す（「ルナ：」のような prefix も付けない）`
}

// ── メイン関数 ────────────────────────────────────────────────
export async function generateGachaReaction(input: ReactionInput): Promise<string> {
  const prompt = buildReactionPrompt(input)
  try {
    const res = await gemini.chat.completions.create({
      model: 'gemini-2.5-flash',
      // thinking + 出力で 200 トークン。短いリアクションなのでこれで十分
      max_tokens: 500,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user',   content: 'リアクションを返して' },
      ],
    })
    const raw = (res.choices[0]?.message?.content ?? '').trim()
    if (!raw) {
      console.warn('[gacha-reaction] empty response, using fallback')
      return pickFallback(input.rarity, input.wasDuplicate)
    }
    // 余計な prefix（「ルナ：」「ルナ:」等）を除去
    const cleaned = raw.replace(/^(ルナ[：:]\s*)/, '').trim()
    // 60 文字超えは切る（プロンプト指示違反時の保険）
    return cleaned.length > 80 ? cleaned.slice(0, 80) + '…' : cleaned
  } catch (e) {
    console.warn('[gacha-reaction] LLM failed, using fallback', e)
    return pickFallback(input.rarity, input.wasDuplicate)
  }
}
