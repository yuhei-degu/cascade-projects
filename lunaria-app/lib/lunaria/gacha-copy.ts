const DRAW_STAGE_ONE = [
  'ふたを開けるよ',
  'ちょっと待ってね…',
  '今日のはなんだろう',
  'ゆっくり開けてみよう',
  'なに来るかなぁ',
  '静かに、開けるね',
  '中身、確かめるね',
]

const DRAW_STAGE_TWO = [
  '月明かりに、かざして…',
  'そっと、覗いてみる',
  '今夜の月箱、開ける',
  'リボンをほどいてる',
  '月箱の奥、見てみるね',
]

const RESULT_HEADINGS: Record<string, string[]> = {
  common_a: [
    'ささやかな贈り物',
    '静かなひと品',
    'ふつうの月箱',
  ],
  common_b: [
    'ささやかなおしゃれ',
    '日常のアクセント',
    'ふだん使いの月箱',
  ],
  rare_a: [
    'ちょっと珍しい家具',
    '月箱のレアもの',
    '印象に残るひと品',
  ],
  rare_b: [
    'ちょっと珍しいアクセサリー',
    '月箱のレアアクセ',
    '着けたくなるひと品',
  ],
  epic: [
    '上位レア',
    '月夜の特別なもの',
    '飾りたくなる一品',
  ],
  legendary: [
    '月箱のレジェンド',
    '滅多に巡り合えないもの',
    '特別な夜の贈り物',
  ],
  urban_legend: [
    '噂の月箱アイテム',
    '月夜の都市伝説',
    '信じられないひと品',
  ],
}

const NO_TICKET_COPY = [
  'チケット切れちゃったね、ちょっと一息つこ',
  'あー、チケット切らしてるや',
  'ちょっと貯めてからまたね',
  'お喋りしてからまた戻っておいで',
  '今日のチケットは終わったみたい',
  'はい、続きはまた今度ね',
  '会話のあとで、また覗いてみて',
  '一息ついてからまた来てね',
  'ルナと話してるとチケット出るかもよ',
]

const DAILY_BONUS_COPY = [
  'はい、今日の分のチケット渡しとく',
  'お、来たね。デイリー分どうぞ',
  '今日のチケット、置いとくね',
  'はい、1 枚追加ね',
  'お、忘れずに来たね。今日もよろしく',
  '今日もありがとう、はいチケット',
  'デイリー分、もらっとこ',
  '来てくれた。ちゃんと渡すね',
  'これ、今日の分。一日よろしくね',
]

function seededIndex(seed: number, salt: number, length: number): number {
  const value = Math.imul(Math.trunc(seed) ^ salt, 2654435761)
  return Math.abs(value) % length
}

function randomPick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getGachaDrawCopy(seed: number, rarity: string) {
  const headings = RESULT_HEADINGS[rarity] ?? RESULT_HEADINGS.common_a
  return {
    stage1: DRAW_STAGE_ONE[seededIndex(seed, 0x11, DRAW_STAGE_ONE.length)],
    stage2: DRAW_STAGE_TWO[seededIndex(seed, 0x22, DRAW_STAGE_TWO.length)],
    reveal: 'そっと受け取って',
    heading: headings[seededIndex(seed, 0x33, headings.length)],
  }
}

export function pickNoTicketCopy(): string {
  return randomPick(NO_TICKET_COPY)
}

export function pickDailyBonusCopy(): string {
  return randomPick(DAILY_BONUS_COPY)
}
