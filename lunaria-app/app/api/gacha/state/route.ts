import { NextResponse } from 'next/server'
import { getGachaState } from '../../../../lib/lunaria/gacha'
import { getAuthenticatedUserId } from '../../_auth'

export async function GET() {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response

    const state = await getGachaState(auth.userId)
    return NextResponse.json(state)
  } catch (e: unknown) {
    console.error('[gacha/state]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
