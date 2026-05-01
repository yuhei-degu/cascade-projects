import { NextResponse } from 'next/server'
import { drawGacha } from '../../../../lib/lunaria/gacha'
import { generateGachaReaction } from '../../../../lib/lunaria/gacha-reaction'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

export async function POST() {
  try {
    const draw = await drawGacha()

    // ルナのリアクション生成（取得直後のみの「受け取り演出」）
    // 会話履歴・core_memory・profile には絶対に保存しない（文脈汚染防止）
    const reaction = await generateGachaReaction({
      itemName:     draw.result.name,
      rarity:       draw.result.rarity,
      category:     draw.result.category,
      description:  draw.result.description,
      wasDuplicate: draw.was_duplicate,
      coinEarned:   draw.coin_earned,
    })

    return NextResponse.json({ ...draw, reaction })
  } catch (e: unknown) {
    const message = errorMessage(e)
    if (message === 'no_ticket') {
      return NextResponse.json({ error: 'no_ticket' }, { status: 400 })
    }
    if (message === 'gacha_pool_empty') {
      return NextResponse.json({ error: 'gacha_pool_empty' }, { status: 500 })
    }
    console.error('[gacha/draw]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
