import { NextResponse } from 'next/server'
import { getGachaState } from '../../../../lib/lunaria/gacha'

export async function GET() {
  try {
    const state = await getGachaState()
    return NextResponse.json(state)
  } catch (e: unknown) {
    console.error('[gacha/state]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
