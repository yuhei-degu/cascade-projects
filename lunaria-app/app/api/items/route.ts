import { NextResponse } from 'next/server'
import { getItemsOverview } from '../../../lib/lunaria/character-items'
import { getAuthenticatedUserId } from '../_auth'

export async function GET() {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response

    const overview = await getItemsOverview(auth.userId)
    return NextResponse.json(overview)
  } catch (error) {
    console.error('[items]', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
