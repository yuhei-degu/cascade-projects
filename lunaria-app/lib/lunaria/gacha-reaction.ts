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
  common_a:     ['お、もらったね！', 'これね、いいじゃん', 'ふつうだけど悪くない'],
  common_b:     ['お、出たね', 'こういうのも好きだよ', 'いいの来た'],
  rare_a:       ['お、レアじゃん！', 'いいの来たね', 'これけっこう珍しいよ'],
  rare_b:       ['お、これいいやつ', 'レアアクセ来た！', 'おしゃれじゃん'],
  epic:         ['お、これはすごい！', 'けっこう良いの来たね', 'やった、エピック！'],
  legendary:    ['え、最高レア！？やば！', 'うわ、これは持ってる人少ないよ！', 'すごいの引いたね、悠平！'],
  urban_legend: ['え、それ…！？マジで！？', 'うわ、都市伝説枠じゃん！', 'こんなの本当に出るんだ笑'],
}

const FALLBACK_DUPLICATE: string[] = [
  'あー、これ前も出たやつ！コインにしとくね',
  'かぶったね、コインに変換しとく',
  'これ持ってるやつだー、まあコイン化',
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
- common_a / common_b：軽い気軽さ（「お、〇〇だ！」「こういうのいいよね」）
- rare_a / rare_b：少し嬉しい（「お、レアじゃん！」「いいの来た」）
- epic：素直な喜び（「これはすごい！」「やった、エピック！」）
- legendary：盛り上がる（「え、最高レア！？やば！」）
- urban_legend：驚愕＋話題性（「え、それ…！？マジで！？」）
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
