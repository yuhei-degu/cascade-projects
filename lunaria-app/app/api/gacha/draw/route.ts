import { NextResponse } from 'next/server'
import { drawGacha } from '../../../../lib/lunaria/gacha'
import { generateGachaReaction } from '../../../../lib/lunaria/gacha-reaction'
import { supabaseAdmin } from '../../../../lib/supabase'
import { trackEvent } from '../../../../lib/track'
import { getAuthenticatedUserId } from '../../_auth'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

export async function POST() {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response

    const draw = await drawGacha(auth.userId)
    void trackEvent(supabaseAdmin, auth.userId, 'gacha_draw')

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
