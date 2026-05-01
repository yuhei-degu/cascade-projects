import { NextResponse } from 'next/server'
import { claimDailyBonus } from '../../../../lib/lunaria/gacha'

export async function POST() {
  try {
    const result = await claimDailyBonus()
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[gacha/daily]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
