const DRAW_STAGE_ONE = [
  '月箱に光が集まる',
  '封印がゆっくりほどける',
  '星屑が箱の中で揺れる',
  '月の紋様が浮かび上がる',
  'リボンが静かにほどける',
  '箱の奥から光が満ちる',
]

const DRAW_STAGE_TWO = [
  '光が弾ける',
  'まばゆい色が走る',
  'レアリティの輝きが広がる',
  '月箱が強くきらめく',
  'カードの輪郭が現れる',
]

const RESULT_HEADINGS: Record<string, string[]> = {
  common_a: ['新しいコレクション', '月箱の小さな贈り物', '部屋になじむ一品'],
  common_b: ['新しいコレクション', 'きらめく小物', '集めたくなる一品'],
  rare_a: ['レアアイテム獲得', '印象的な家具', '特別な一品'],
  rare_b: ['レアアイテム獲得', '光るアクセサリ', '特別な一品'],
  epic: ['SRアイテム獲得', 'まばゆい逸品', '月箱の上位レア'],
  legendary: ['SSRアイテム獲得', '伝説級の宝物', '強い輝きの一品'],
  urban_legend: ['URアイテム獲得', '都市伝説級の発見', 'ひそかな伝説'],
}

const NO_TICKET_COPY = [
  'チケットが足りません。',
  'チケットを受け取ってから開けられます。',
  '今日はまだ月箱を開ける準備が足りません。',
  '次のチケットを待ちましょう。',
]

const DAILY_BONUS_COPY = [
  '今日のチケットを受け取りました。',
  '月箱チケットを1枚追加しました。',
  '今日の分を補充しました。',
  '新しい抽選の準備ができました。',
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
    reveal: 'カードが反転する',
    heading: headings[seededIndex(seed, 0x33, headings.length)],
  }
}

export function pickNoTicketCopy(): string {
  return randomPick(NO_TICKET_COPY)
}

export function pickDailyBonusCopy(): string {
  return randomPick(DAILY_BONUS_COPY)
}
