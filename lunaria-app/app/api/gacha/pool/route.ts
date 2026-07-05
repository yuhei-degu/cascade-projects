import { NextResponse } from 'next/server'
import { fetchPool } from '../../../../lib/lunaria/gacha'
import { getAuthenticatedUserId } from '../../_auth'

export async function GET() {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response

    const items = await fetchPool()
    return NextResponse.json({ items })
  } catch (e: unknown) {
    console.error('[gacha/pool]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
