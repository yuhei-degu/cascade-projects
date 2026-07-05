import { NextResponse } from 'next/server'
import { claimDailyBonus } from '../../../../lib/lunaria/gacha'
import { getAuthenticatedUserId } from '../../_auth'

export async function POST() {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response

    const result = await claimDailyBonus(auth.userId)
    return NextResponse.json(result)
  } catch (e: unknown) {
    console.error('[gacha/daily]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
